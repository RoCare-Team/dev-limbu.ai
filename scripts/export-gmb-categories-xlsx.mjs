#!/usr/bin/env node
/**
 * Export ALL Google Business Profile categories to an Excel (.xlsx) file.
 *
 * Pulls the full category catalog from the Business Information API
 * (categories.list) using pagination (nextPageToken) until exhausted, then writes
 * two columns — GCID | Display Name — to:
 *
 *     google-business-profile-categories.xlsx
 *
 * Auth (a valid Google OAuth access token with business.manage scope is required):
 *   - Pass one directly:      --token=ya29....
 *   - Or set env:             GOOGLE_ACCESS_TOKEN=ya29....
 *   - Or let the script mint one from a refresh token:
 *       GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN (in .env.local)
 *
 * Usage:
 *   node scripts/export-gmb-categories-xlsx.mjs                       # region IN, language en
 *   node scripts/export-gmb-categories-xlsx.mjs --region=US --language=en
 *   node scripts/export-gmb-categories-xlsx.mjs --token=ya29....
 *   node scripts/export-gmb-categories-xlsx.mjs --out=categories.xlsx
 *
 * Reads GOOGLE_* from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import mongoose from "mongoose";

// ── load .env.local (simple parser) ────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const GMB_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const OUT_FILE = "google-business-profile-categories.xlsx";

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split("=").slice(1).join("=") : def;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── auth ───────────────────────────────────────────────────────────────────────
// Exchange a single refresh token for a fresh access token.
async function refreshWithToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local (or pass --token=<accessToken>).");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `token refresh failed (${res.status})`);
  }
  return data.access_token;
}

// Gather Google refresh tokens (business.manage scope) from where the app stores them:
// NextAuth `accounts`, `googlebusinessprofiles`, then legacy `gmbusers`.
let candidateTokens = null;
let candidateIndex = 0;
async function loadRefreshTokenCandidates() {
  if (candidateTokens) return candidateTokens;
  // A GOOGLE_REFRESH_TOKEN in env, if present, takes priority.
  const out = [];
  const push = (rt, src) => {
    const t = typeof rt === "string" ? rt.trim() : "";
    if (t && !out.some((c) => c.token === t)) out.push({ token: t, src });
  };
  if (process.env.GOOGLE_REFRESH_TOKEN) push(process.env.GOOGLE_REFRESH_TOKEN, "env");

  const uri = process.env.MONGODB_URI;
  if (uri) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    }
    const db = mongoose.connection;
    try {
      const accts = await db
        .collection("accounts")
        .find({ provider: "google", refresh_token: { $nin: [null, ""] } })
        .project({ refresh_token: 1, scope: 1 })
        .toArray();
      for (const a of accts) {
        if (String(a.scope || "").includes("business.manage")) push(a.refresh_token, "accounts");
      }
    } catch {
      /* ignore */
    }
    try {
      const profs = await db
        .collection("googlebusinessprofiles")
        .find({ refreshToken: { $nin: [null, ""] } })
        .project({ refreshToken: 1 })
        .limit(50)
        .toArray();
      for (const p of profs) push(p.refreshToken, "googlebusinessprofiles");
    } catch {
      /* ignore */
    }
    try {
      const doc = await db.collection("gmbusers").findOne({ "projects.refreshToken": { $nin: [null, ""] } });
      for (const proj of doc?.projects || []) push(proj?.refreshToken, "gmbusers");
    } catch {
      /* ignore */
    }
  }
  candidateTokens = out;
  return out;
}

// Refresh using the next available candidate; throws only when all are exhausted.
async function refreshAccessTokenFromCandidates() {
  const candidates = await loadRefreshTokenCandidates();
  if (!candidates.length) {
    throw new Error(
      "No usable auth: pass --token=<accessToken>, set a valid GOOGLE_ACCESS_TOKEN / GOOGLE_REFRESH_TOKEN, " +
        "or provide MONGODB_URI so a stored refresh token (business.manage) can be used."
    );
  }
  let lastErr;
  for (; candidateIndex < candidates.length; candidateIndex++) {
    const c = candidates[candidateIndex];
    try {
      const tok = await refreshWithToken(c.token);
      console.log(`[export] using access token refreshed from ${c.src}.`);
      candidateIndex++; // consume this one so a later 401/403 tries the next
      return tok;
    } catch (e) {
      lastErr = e;
      console.warn(`[export] refresh via ${c.src} failed: ${e.message} — trying next…`);
    }
  }
  throw new Error(`All refresh tokens failed. Last error: ${lastErr?.message || "unknown"}`);
}

let accessToken = "";
let usedDirectToken = false;
async function ensureToken() {
  if (accessToken) return accessToken;
  // Only honor a directly-supplied token on the FIRST attempt; if it 401s we
  // fall through to refreshing a real token rather than re-using the dead one.
  const direct = arg("token", process.env.GOOGLE_ACCESS_TOKEN || "");
  if (direct && !usedDirectToken) {
    usedDirectToken = true;
    accessToken = direct;
    return accessToken;
  }
  accessToken = await refreshAccessTokenFromCandidates();
  return accessToken;
}

// ── fetch one page, with rate-limit / transient-error handling ──────────────────
async function fetchCategoriesPage(regionCode, languageCode, pageToken) {
  // `attempt` counts only backoff-worthy failures (429/5xx/network); auth rotations
  // (401/403) don't consume it — they're bounded by the candidate list instead.
  let attempt = 0;
  for (let guard = 0; guard < 200; guard++) {
    const url = new URL(`${GMB_BASE}/categories`);
    url.searchParams.set("regionCode", regionCode);
    url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("view", "BASIC");
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const token = await ensureToken();
    let res;
    try {
      res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    } catch (netErr) {
      // Network blip — back off and retry.
      if (attempt >= 6) throw new Error(`network error after retries: ${netErr.message}`);
      const wait = 2 ** attempt++ * 500;
      console.warn(`[export] network error: ${netErr.message} — retrying in ${wait}ms…`);
      await sleep(wait);
      continue;
    }

    // Expired/revoked token, or a refresh token that lacks business.manage —
    // drop it and let ensureToken() rotate to the next candidate.
    if (res.status === 401 || res.status === 403) {
      accessToken = "";
      continue;
    }

    // Rate limited or transient server error — exponential backoff (honor Retry-After).
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 6) throw new Error(`Google API ${res.status} after 6 backoff retries (rate limit / server error).`);
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
      console.warn(`[export] HTTP ${res.status} — backing off ${wait}ms (attempt ${++attempt}/6)…`);
      await sleep(wait);
      continue;
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      throw new Error(data?.error?.message || `Google API ${res.status}: ${text.slice(0, 200)}`);
    }
    return data;
  }
  throw new Error("Exhausted attempts fetching a categories page.");
}

// ── paginate through every category ─────────────────────────────────────────────
async function fetchAllCategories(regionCode, languageCode) {
  const all = [];
  let pageToken = "";
  for (;;) {
    const data = await fetchCategoriesPage(regionCode, languageCode, pageToken);
    if (Array.isArray(data.categories)) all.push(...data.categories);
    pageToken = data.nextPageToken || "";
    process.stdout.write(`\r  [${regionCode}/${languageCode}] fetched ${all.length}…   `);
    if (!pageToken) break;
  }
  process.stdout.write("\n");
  return all;
}

// ── main ─────────────────────────────────────────────────────────────────────--
(async () => {
  const regionCode = arg("region", "IN").trim().toUpperCase() || "IN";
  const languageCode = arg("language", "en").trim() || "en";
  const outFile = arg("out", OUT_FILE);

  console.log(`[export] fetching categories for region=${regionCode} language=${languageCode} …`);
  const categories = await fetchAllCategories(regionCode, languageCode);

  // Build rows: GCID (the API `name` with the "categories/" prefix stripped) + Display Name.
  const seen = new Set();
  const rows = [];
  for (const c of categories) {
    const gcid = String(c?.name || "").replace(/^categories\//, "").trim(); // e.g. "gcid:restaurant"
    const displayName = String(c?.displayName || "").trim();
    if (!gcid || !displayName || seen.has(gcid)) continue;
    seen.add(gcid);
    rows.push({ GCID: gcid, "Display Name": displayName });
  }
  rows.sort((a, b) => a["Display Name"].localeCompare(b["Display Name"]));

  if (!rows.length) {
    console.error("[export] no categories returned — nothing to write.");
    process.exit(1);
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: ["GCID", "Display Name"] });
  worksheet["!cols"] = [{ wch: 42 }, { wch: 40 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

  const outPath = path.resolve(process.cwd(), outFile);
  XLSX.writeFile(workbook, outPath);
  console.log(`[export] wrote ${rows.length} categories → ${outPath}`);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(0);
})().catch(async (e) => {
  console.error("\n[export] error:", e.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
