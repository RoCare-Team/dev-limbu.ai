#!/usr/bin/env node
/**
 * Sync ALL Google Business Profile categories into MongoDB.
 *
 * Pulls the full category catalog from the Business Information API
 * (categories.list — the REAL list Google supports) for one or more regions and
 * upserts each into the `gmbcategories` collection, with searchable tokens for
 * name-similarity suggestions.
 *
 * Auth (a valid Google OAuth access token with business.manage scope is required):
 *   - Pass one directly:      --token=ya29....
 *   - Or set env:             GOOGLE_ACCESS_TOKEN=ya29....
 *   - Or let the script refresh from a stored GmbUser refresh token
 *     (needs GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local).
 *
 * Usage:
 *   node scripts/sync-gmb-categories.mjs                 # region IN, language en
 *   node scripts/sync-gmb-categories.mjs --region=IN,US --language=en
 *   node scripts/sync-gmb-categories.mjs --token=ya29....
 *
 * Reads MONGODB_URI (and optionally GOOGLE_* ) from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

// This project is CommonJS (no "type":"module"), so a .mjs script can't import the
// app's ESM model/lib files. The schema + tokenizer are inlined here to match
// src/models/GmbCategory.js and src/lib/gmbCategoryTokens.js exactly (same collection
// "gmbcategories" and same field shape), so the app reads the rows this writes.
const STOP_WORDS = new Set([
  "company", "store", "shop", "service", "services", "repair", "repairs",
  "center", "centre", "dealer", "dealers", "supplier", "suppliers",
  "manufacturer", "manufacturers", "contractor", "contractors", "agency",
  "agencies", "provider", "providers", "consultant", "consultants", "firm",
  "and", "the", "of", "in", "for", "or", "a", "an", "to", "with",
]);
function categoryTokens(displayName) {
  const words = String(displayName || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && w.length >= 3 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

const GmbCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    displayNameLower: { type: String, required: true },
    tokens: { type: [String], default: [] },
    regionCode: { type: String, required: true },
    languageCode: { type: String, required: true, default: "en" },
  },
  { timestamps: true, collection: "gmbcategories" }
);
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, name: 1 }, { unique: true });
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, displayNameLower: 1 });
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, tokens: 1 });
const GmbCategory = mongoose.model("GmbCategory", GmbCategorySchema);

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

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split("=").slice(1).join("=") : def;
}

const DEFAULT_DB = process.env.MONGODB_DB_NAME || "gmb_dashboard";
function resolveUri(raw) {
  if (!raw) return raw;
  if (/\/\/[^/]+\/[^/?]+/.test(raw)) return raw;
  const q = raw.indexOf("?");
  const base = (q === -1 ? raw : raw.slice(0, q)).replace(/\/$/, "");
  const qs = q === -1 ? "" : raw.slice(q);
  return `${base}/${DEFAULT_DB}${qs}`;
}

// Gather Google refresh tokens (with business.manage scope) from wherever the app
// stores them, in priority order. In this DB that is the NextAuth `accounts`
// collection and the `googlebusinessprofiles` collection ( `gmbusers` is empty ).
let candidateTokens = null;
let candidateIndex = 0;
async function loadRefreshTokenCandidates() {
  if (candidateTokens) return candidateTokens;
  const db = mongoose.connection;
  const out = [];
  const push = (rt, src) => {
    const t = typeof rt === "string" ? rt.trim() : "";
    if (t && !out.some((c) => c.token === t)) out.push({ token: t, src });
  };
  // 1) NextAuth google accounts with the business.manage scope.
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
  // 2) GMB business profiles (per-business tokens — business.manage by definition).
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
  // 3) Legacy GmbUser projects (kept for other environments).
  try {
    const doc = await db
      .collection("gmbusers")
      .findOne({ "projects.refreshToken": { $nin: [null, ""] } });
    for (const proj of doc?.projects || []) push(proj?.refreshToken, "gmbusers");
  } catch {
    /* ignore */
  }
  candidateTokens = out;
  return out;
}

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

// Refresh using the next available candidate; throws only when all are exhausted.
async function refreshAccessTokenFromDb() {
  const candidates = await loadRefreshTokenCandidates();
  if (!candidates.length) {
    throw new Error(
      "No Google refresh token found in accounts / googlebusinessprofiles / gmbusers. Pass --token=<accessToken> instead."
    );
  }
  let lastErr;
  for (; candidateIndex < candidates.length; candidateIndex++) {
    const c = candidates[candidateIndex];
    try {
      const tok = await refreshWithToken(c.token);
      console.log(`[sync] using access token refreshed from ${c.src}.`);
      candidateIndex++; // consume this one so a later 401 tries the next
      return tok;
    } catch (e) {
      lastErr = e;
      console.warn(`[sync] refresh via ${c.src} failed: ${e.message} — trying next…`);
    }
  }
  throw new Error(`All refresh tokens failed. Last error: ${lastErr?.message || "unknown"}`);
}

let accessToken = "";
async function ensureToken() {
  if (accessToken) return accessToken;
  const direct = arg("token", process.env.GOOGLE_ACCESS_TOKEN || "");
  accessToken = direct || (await refreshAccessTokenFromDb());
  return accessToken;
}

// Fetch a single page. On 401/403 (token expired OR the refresh token lacked the
// business.manage scope), rotate to the NEXT candidate token and retry — many stored
// refresh tokens refresh fine but can't call the API, so we skip past them here.
async function fetchCategoriesPage(regionCode, languageCode, pageToken) {
  for (let authTries = 0; authTries < 100; authTries++) {
    const url = new URL(`${GMB_BASE}/categories`);
    url.searchParams.set("regionCode", regionCode);
    url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("view", "BASIC");
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const token = await ensureToken();
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 401 || res.status === 403) {
      accessToken = ""; // force ensureToken() to refresh the NEXT candidate
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
  throw new Error("Could not get a working token (all candidates returned 401/403). Pass --token=<accessToken>.");
}

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

async function upsertCategories(categories, regionCode, languageCode) {
  const ops = [];
  const seen = new Set();
  for (const c of categories) {
    const name = String(c?.name || "").replace(/^categories\//, "").trim();
    const displayName = String(c?.displayName || "").trim();
    if (!name || !displayName || seen.has(name)) continue;
    seen.add(name);
    ops.push({
      updateOne: {
        filter: { regionCode, languageCode, name },
        update: {
          $set: {
            name,
            displayName,
            displayNameLower: displayName.toLowerCase(),
            tokens: categoryTokens(displayName),
            regionCode,
            languageCode,
          },
        },
        upsert: true,
      },
    });
  }
  if (!ops.length) return { upserted: 0, modified: 0, total: 0 };
  // Chunk bulkWrites to keep each request reasonable.
  let upserted = 0;
  let modified = 0;
  for (let i = 0; i < ops.length; i += 500) {
    const chunk = ops.slice(i, i + 500);
    const r = await GmbCategory.bulkWrite(chunk, { ordered: false });
    upserted += r.upsertedCount || 0;
    modified += r.modifiedCount || 0;
  }
  return { upserted, modified, total: ops.length };
}

(async () => {
  const uri = resolveUri(process.env.MONGODB_URI);
  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  const regions = arg("region", "IN")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const languageCode = arg("language", "en").trim() || "en";

  console.log("[sync] connecting:", uri.replace(/:\/\/.*@/, "://<credentials>@"));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("[sync] DB:", mongoose.connection.db?.databaseName);
  // Make sure indexes (incl. the unique compound one) exist before bulk upserts.
  await GmbCategory.init();

  let grandTotal = 0;
  for (const regionCode of regions) {
    console.log(`\n[sync] fetching categories for region=${regionCode} language=${languageCode} …`);
    const categories = await fetchAllCategories(regionCode, languageCode);
    const { upserted, modified, total } = await upsertCategories(categories, regionCode, languageCode);
    grandTotal += total;
    console.log(
      `[sync] ${regionCode}: ${total} categories saved (new: ${upserted}, updated: ${modified}).`
    );
  }

  const count = await GmbCategory.estimatedDocumentCount();
  console.log(`\n[sync] done. ${grandTotal} categories processed this run. Collection now holds ~${count} rows.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("\n[sync] error:", e.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
