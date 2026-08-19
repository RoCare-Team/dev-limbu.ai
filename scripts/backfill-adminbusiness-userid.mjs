/**
 * `adminbusinesses` collection (GMB dashboard cache, /api/admin/saveBussiness)
 * pehle sirf `userEmail` se unique thi. Do alag app `userId` same email share
 * kar sakte the (impersonation, dobara-connect, ya duplicate accounts) —
 * tab ek user ka GMB data doosre ke dashboard par dikh jata tha.
 *
 * Ab `userId` asli key hai. Ye script purane records me email se matching
 * `users` collection dhoondh kar `userId` bhar deta hai.
 *
 * Chalane ka tareeqa:
 *   node scripts/backfill-adminbusiness-userid.mjs          # dry run (sirf report)
 *   node scripts/backfill-adminbusiness-userid.mjs --apply  # actually likhta hai
 *
 * Ye optional hai — naya `POST /api/admin/saveBussiness` call apne aap sahi
 * userId ke saath likhta hai, isliye active users apne aap migrate ho jaate
 * hain agli GMB sync par. Script sirf ab-tak-inactive purane records ke liye
 * hai (taaki `/admin/user-listings?userId=...` unhe bhi turant dikha sake).
 *
 * Purana data delete nahi hota; sirf `userId` field add hoti hai.
 */
import "dotenv/config";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing — .env.local load hua?");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const users = db.collection("users"); // app users (userId: USR…)
const adminBusinesses = db.collection("adminbusinesses");

const stats = { scanned: 0, alreadyHasUserId: 0, matched: 0, ambiguous: 0, noMatch: 0, written: 0 };

const cursor = adminBusinesses.find({});

for await (const biz of cursor) {
  stats.scanned++;

  if (biz.userId) {
    stats.alreadyHasUserId++;
    continue;
  }
  if (!biz.userEmail) continue;

  const rx = new RegExp(
    `^${biz.userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );
  const matches = await users.find({ email: rx }).project({ userId: 1 }).toArray();

  if (matches.length === 0) {
    stats.noMatch++;
    continue;
  }
  if (matches.length > 1) {
    // Ek se zyada userId isi email par — kis user ka ye cache hai pata nahi,
    // isliye chhu nahi rahe. Agli live GMB sync khud sahi userId likh degi.
    stats.ambiguous++;
    console.log(
      `  [skip] ${biz.userEmail}: ${matches.length} users share this email — resolve manually`,
    );
    continue;
  }

  stats.matched++;
  if (APPLY) {
    await adminBusinesses.updateOne(
      { _id: biz._id },
      { $set: { userId: matches[0].userId } },
    );
    stats.written++;
  }
}

console.log(APPLY ? "\n=== APPLIED ===" : "\n=== DRY RUN (koi write nahi) ===");
console.table(stats);
console.log(
  `\n${stats.matched} records ${APPLY ? "migrate ho gaye" : "migrate ho jaayenge (--apply se)"}.\n` +
  `${stats.ambiguous} ambiguous (ek email, multiple userId) — manually check karein.\n` +
  `${stats.noMatch} ka koi matching app user nahi mila — orphaned cache, safe hai ignore karna.`,
);

await mongoose.disconnect();
