#!/usr/bin/env node
/**
 * READ-ONLY: list active automation plans (userId, mode, posting time, platforms).
 * No writes. Reads MONGODB_URI from .env.local. Used to pick a real userId for the
 * e2e checker.
 *
 *   node scripts/list-active-plans.mjs
 */
import fs from "node:fs";
import path from "node:path";
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

const DEFAULT_DB = process.env.MONGODB_DB_NAME || "gmb_dashboard";
function resolveUri(raw) {
  if (!raw) return raw;
  if (/\/\/[^/]+\/[^/?]+/.test(raw)) return raw;
  const q = raw.indexOf("?");
  const base = (q === -1 ? raw : raw.slice(0, q)).replace(/\/$/, "");
  const qs = q === -1 ? "" : raw.slice(q);
  return `${base}/${DEFAULT_DB}${qs}`;
}

const uri = resolveUri(process.env.MONGODB_URI);
if (!uri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const planSchema = new mongoose.Schema({}, { strict: false, collection: "automationplans" });
const Plan = mongoose.model("AutomationPlanRO", planSchema);

(async () => {
  console.log("[list-active-plans] connecting:", uri.replace(/:\/\/.*@/, "://<credentials>@"));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("[list-active-plans] DB:", mongoose.connection.db?.databaseName, "\n");

  const plans = await Plan.find({ active: true, automationEnabled: true })
    .select("userId businessName postQueueMode platforms postingHour postingMinute frequency keywords locations startDate endDate planDetails lastPostDate")
    .sort({ updatedAt: -1 })
    .lean();

  console.log(`Active automation plans: ${plans.length}\n`);
  for (const p of plans) {
    console.log(`• userId        : ${p.userId}`);
    console.log(`  business      : ${p.businessName || "-"}`);
    console.log(`  mode          : ${p.postQueueMode || "legacy"}   ${p.postQueueMode === "delay_generate_publish" ? "(delay pipeline)" : "(legacy pipeline)"}`);
    console.log(`  platforms     : ${(p.platforms || []).join(",")}`);
    console.log(`  postingTime   : ${p.postingHour}:${String(p.postingMinute ?? 0).padStart(2, "0")} (${p.frequency})`);
    console.log(`  keywords/locs : ${(p.keywords || []).length} kw / ${(p.locations || []).length} loc`);
    console.log(`  quota         : used ${p.planDetails?.postsUsed ?? 0} / ${p.planDetails?.limit ?? "?"}`);
    console.log(`  start→end     : ${p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : "-"} → ${p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : "-"}`);
    console.log(`  lastPostDate  : ${p.lastPostDate ? new Date(p.lastPostDate).toISOString() : "-"}`);
    console.log("");
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error("[list-active-plans] error:", e.message);
  process.exit(1);
});
