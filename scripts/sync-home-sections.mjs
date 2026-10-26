/**
 * seed.json ke `gbp` aur `social_media` sections ke tiles live `home_sections`
 * collection me daal deta hai. seedIfEmpty() sirf khaali collection par chalta
 * hai, isliye seed.json badalne ke baad production DB update karne ke liye ye
 * script chahiye.
 *
 * Chalane ka tareeqa:
 *   node scripts/sync-home-sections.mjs          # dry run (sirf report)
 *   node scripts/sync-home-sections.mjs --apply  # actually likhta hai
 *
 * Sirf in sections ke `items` replace hote hain — title, order, isActive jaise
 * admin ke set kiye fields wahi rehte hain. Baaki sections ko haath nahi lagta.
 */
import dotenv from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });
dotenv.config();

const APPLY = process.argv.includes("--apply");
const SECTION_KEYS = ["gbp", "social_media"];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing — .env.local load hua?");
  process.exit(1);
}

const seed = JSON.parse(
  readFileSync(new URL("../src/lib/homeSections/seed.json", import.meta.url), "utf8")
);

await mongoose.connect(uri);
const sections = mongoose.connection.db.collection("home_sections");

if (APPLY) {
  // Likhne se pehle purane sections ka backup — galti ho to isi se wapas daal sakte ho.
  const backup = await sections.find({ key: { $in: SECTION_KEYS } }).toArray();
  const file = `home-sections-backup-${Date.now()}.json`;
  writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(`Backup: ${file}`);
}

for (const key of SECTION_KEYS) {
  const section = seed.sections.find((s) => s.key === key);
  const items = section.items.map((item) => ({ ...item, isActive: item.isActive !== false }));
  const existing = await sections.findOne({ key });

  console.log(`\n[${key}] ${existing ? "update" : "insert"}`);
  console.log("  pehle:", existing ? existing.items.map((i) => i.key).join(", ") : "(section nahi hai)");
  console.log("  ab   :", items.map((i) => `${i.key}${i.access?.freeForAll ? " (FREE)" : ""}`).join(", "));

  if (!APPLY) continue;

  const now = new Date();
  if (existing) {
    // updatedAt badalna zaroori hai — /api/home-sections ka `version` isi se banta hai.
    await sections.updateOne({ key }, { $set: { items, updatedAt: now } });
  } else {
    await sections.insertOne({ ...section, items, isActive: true, createdAt: now, updatedAt: now });
  }
}

console.log(APPLY ? "\nDone — DB update ho gaya." : "\nDry run — likhne ke liye --apply lagao.");
await mongoose.disconnect();
