/**
 * `gmb_connections` collection par purana unique index sirf `userId` par tha —
 * jab tak wo hata na diya jaye, ek user ke do slots (`connectedBy: "self"` aur
 * `connectedBy: "admin_impersonation"`) save nahi ho sakte (E11000 duplicate
 * key error). Dekho: src/models/GmbConnection.js
 *
 * Ye script:
 *   1. Purane records me `connectedBy` field missing ho to "self" bhar deta hai
 *      (schema default hai, par existing raw documents me field nahi hota jab
 *      tak koi save() na ho — isliye explicit backfill).
 *   2. Purana `userId_1` unique index drop karta hai.
 *   3. Naya `{userId: 1, connectedBy: 1}` unique index banata hai.
 *
 * Chalane ka tareeqa:
 *   node scripts/migrate-gmb-connection-index.mjs          # dry run (sirf report)
 *   node scripts/migrate-gmb-connection-index.mjs --apply  # actually likhta hai
 *
 * Safe hai dobara chalana bhi (idempotent) — index pehle se sahi ho to kuch
 * nahi badalta.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

// `dotenv/config` sirf `.env` load karta hai — is repo ka config `.env.local`
// me hai (Next.js convention). Explicit path zaroori hai, warna
// MONGODB_URI hamesha "missing" dikhta hai chahe file maujood ho.
dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing — .env.local load hua?");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const coll = db.collection("gmb_connections");

// ── Step 1: missing connectedBy backfill ──────────────────────────────────
const missing = await coll.countDocuments({ connectedBy: { $exists: false } });
console.log(`Records without connectedBy: ${missing}`);
if (missing > 0) {
  if (APPLY) {
    const res = await coll.updateMany(
      { connectedBy: { $exists: false } },
      { $set: { connectedBy: "self" } },
    );
    console.log(`  → backfilled ${res.modifiedCount} record(s) with connectedBy: "self"`);
  } else {
    console.log(`  → (dry run) would set connectedBy: "self" on these`);
  }
}

// ── Step 2: drop old unique index on userId alone ──────────────────────────
const indexes = await coll.indexes();
const oldIndex = indexes.find(
  (ix) => ix.unique && Object.keys(ix.key).length === 1 && ix.key.userId === 1,
);

if (oldIndex) {
  console.log(`Found old unique index: ${oldIndex.name}`);
  if (APPLY) {
    await coll.dropIndex(oldIndex.name);
    console.log(`  → dropped ${oldIndex.name}`);
  } else {
    console.log(`  → (dry run) would drop ${oldIndex.name}`);
  }
} else {
  console.log("No old single-field unique userId index found (already migrated?).");
}

// ── Step 3: ensure new compound unique index ────────────────────────────────
const hasNewIndex = indexes.some(
  (ix) => ix.unique && ix.key.userId === 1 && ix.key.connectedBy === 1,
);

if (!hasNewIndex) {
  if (APPLY) {
    await coll.createIndex({ userId: 1, connectedBy: 1 }, { unique: true });
    console.log("  → created new unique index {userId:1, connectedBy:1}");
  } else {
    console.log("(dry run) would create new unique index {userId:1, connectedBy:1}");
  }
} else {
  console.log("New compound unique index already exists.");
}

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write changes.");
}

await mongoose.disconnect();
