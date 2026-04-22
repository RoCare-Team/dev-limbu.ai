/**
 * Persists `paymentLink` + `planKey` on every plan in Mongo `homedatas` for:
 *   - type: subscriptionPlans  (under `data`, normalized from legacy root fields if needed)
 *   - type: pricingLanding      (merged with defaults, all plan arrays get paymentLink)
 *
 * IMPORTANT — database name:
 *   Your Atlas screenshot uses DB `test`. If MONGODB_URI has no /dbname, set:
 *     MONGODB_DB_NAME=test
 *   in `.env.local` (mongooseConnectionUri appends this as the DB name).
 *
 * Link host: set NEXT_PUBLIC_SITE_URL=https://limbu.ai (or http://localhost:3000 for dev).
 *
 * Test plan (`subscription-basic-test`) is stored with payment links for direct checkout only;
 * it is not shown on the home “Our Package” section (`listOnHomepage: false`).
 *
 * Run from repo root (writes `homedatas` for subscriptionPlans + pricingLanding):
 *   npm run backfill:payment-links
 *   npm run backfill:subscription-payment-links
 *   node scripts/backfill-subscription-plan-payment-links.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "../src/lib/mongoConnectionUri.js";
import {
  expandSubscriptionPlansForApi,
  getSubscriptionPlansPayloadForExpand,
} from "../src/lib/subscriptionPlansApi.js";
import {
  expandPricingLandingForApi,
  mergePricingLanding,
} from "../src/lib/pricingLandingDefaults.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const uri = mongooseConnectionUri(process.env.MONGODB_URI);
if (!uri) {
  console.error("Set MONGODB_URI in .env or .env.local");
  process.exit(1);
}

await mongoose.connect(uri);
const dbName = mongoose.connection.db?.databaseName;
const col = mongoose.connection.db.collection("homedatas");

console.log(`[backfill] Connected — database: "${dbName}"  collection: homedatas`);
if (dbName === "gmb_dashboard" && process.env.MONGODB_DB_NAME !== "test") {
  console.warn(
    "[backfill] Tip: Atlas shows DB `test`. If this is wrong, set MONGODB_DB_NAME=test and use an URI without a conflicting /dbname.",
  );
}

function clone(obj) {
  return structuredClone
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

// --- subscriptionPlans -------------------------------------------------

async function backfillSubscriptionPlans() {
  // Primary: official HomeData shape
  let cursor = col.find({ type: "subscriptionPlans" });
  let n = 0;

  for await (const raw of cursor) {
    const payload = getSubscriptionPlansPayloadForExpand(raw);
    const base =
      payload && Array.isArray(payload.billingCycles)
        ? payload
        : raw.data && Array.isArray(raw.data?.billingCycles)
          ? { ...raw.data }
          : null;

    if (!base?.billingCycles?.length) {
      console.warn(
        "[backfill] Skip document — could not resolve billingCycles:",
        raw._id,
      );
      continue;
    }

    const expanded = expandSubscriptionPlansForApi(clone(base));

    const update = {
      $set: {
        data: expanded,
        updatedAt: new Date(),
      },
    };

    // If old docs stored gstRate/billingCycles at root (outside `data`), remove dupes so Compass shows one canonical `data`.
    const unset = {};
    if (raw.billingCycles != null) unset.billingCycles = "";
    if (raw.gstRate != null && expanded.gstRate !== undefined) unset.gstRate = "";
    if (raw.currency != null && expanded.currency !== undefined)
      unset.currency = "";

    if (Object.keys(unset).length) {
      update.$unset = unset;
    }

    await col.updateOne({ _id: raw._id }, update);
    console.log("[backfill] subscriptionPlans ✓", String(raw._id));
    n++;
  }

  // Legacy: billingCycles only at root (no nested `data`) — still subscription catalog
  if (n === 0) {
    const leg = await col
      .find({
        billingCycles: { $exists: true, $type: "array", $ne: [] },
        $or: [{ data: { $exists: false } }, { data: null }],
      })
      .toArray();

    for (const raw of leg) {
      const payload = getSubscriptionPlansPayloadForExpand(raw);
      const base =
        payload && Array.isArray(payload.billingCycles)
          ? payload
          : raw.data && Array.isArray(raw.data?.billingCycles)
            ? { ...raw.data }
            : null;
      if (!base?.billingCycles?.length) continue;

      const expanded = expandSubscriptionPlansForApi(clone(base));
      const update = {
        $set: { data: expanded, updatedAt: new Date() },
        $unset: {},
      };
      if (raw.billingCycles != null) update.$unset.billingCycles = "";
      if (raw.gstRate != null) update.$unset.gstRate = "";
      if (raw.currency != null) update.$unset.currency = "";
      if (!Object.keys(update.$unset).length) delete update.$unset;

      await col.updateOne({ _id: raw._id }, update);
      console.log("[backfill] subscriptionPlans (legacy root) ✓", String(raw._id));
      n++;
    }
  }

  console.log(`[backfill] subscriptionPlans total updated: ${n}`);
}

// --- pricingLanding ----------------------------------------------------

async function backfillPricingLanding() {
  const raw = await col.findOne({ type: "pricingLanding" });
  if (!raw) {
    console.log("[backfill] No pricingLanding document — skip.");
    return;
  }

  const merged = mergePricingLanding(raw);
  const expanded = expandPricingLandingForApi(merged);

  await col.updateOne(
    { _id: raw._id },
    { $set: { data: expanded, updatedAt: new Date() } },
  );
  console.log("[backfill] pricingLanding ✓", String(raw._id));
}

try {
  await backfillSubscriptionPlans();
  await backfillPricingLanding();
} catch (e) {
  console.error("[backfill] Error:", e);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

console.log("[backfill] Done. Refresh Atlas Data Explorer.");
process.exit(process.exitCode ?? 0);
