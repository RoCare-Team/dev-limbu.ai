/**
 * Purane NextAuth-era GMB tokens ko naye `gmb_connections` collection me le aata hai.
 *
 * Chalane ka tareeqa:
 *   node scripts/backfill-gmb-connections.mjs          # dry run (sirf report)
 *   node scripts/backfill-gmb-connections.mjs --apply  # actually likhta hai
 *
 * Ye optional hai — `lib/gmbSession.js` pehle access par apne aap backfill kar
 * deta hai. Script se aap migration se PEHLE dekh sakte ho kitne users cleanly
 * migrate honge aur kitno ko reconnect karna padega.
 *
 * Purana data delete nahi hota; sirf padha jata hai.
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

const users = db.collection("users");           // app users (userId: USR…)
const gmbDashboard = mongoose.connection.client.db("gmb_dashboard");
const legacy = gmbDashboard.collection("users");
const target = db.collection("gmb_connections");

const stats = { scanned: 0, matched: 0, noEmail: 0, noRefresh: 0, already: 0, written: 0 };

const cursor = users.find({ email: { $exists: true, $ne: "" } }, { projection: { userId: 1, email: 1 } });

for await (const user of cursor) {
  stats.scanned++;
  if (!user.userId || !user.email) { stats.noEmail++; continue; }

  const existing = await target.findOne({ userId: user.userId });
  if (existing) { stats.already++; continue; }

  const rx = new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const legacyUser = await legacy.findOne({ email: rx });
  if (!legacyUser?.projects?.length) continue;

  stats.matched++;
  const project =
    legacyUser.projects.find((p) => p.refreshToken) || legacyUser.projects[0];
  if (!project?.refreshToken) { stats.noRefresh++; continue; }

  if (APPLY) {
    await target.updateOne(
      { userId: user.userId },
      {
        $set: {
          userId: user.userId,
          googleId: project.googleId,
          email: legacyUser.email,
          name: legacyUser.name,
          image: legacyUser.image,
          accessToken: project.accessToken,
          refreshToken: project.refreshToken,
          // Purana access token stale — pehle use par refresh ho jayega.
          accessTokenExpires: 0,
          connectedAt: project.createdAt || new Date(),
          updatedAt: new Date(),
          invalid: false,
        },
      },
      { upsert: true },
    );
  }
  stats.written++;
}

console.log(APPLY ? "\n=== APPLIED ===" : "\n=== DRY RUN (koi write nahi) ===");
console.table(stats);
console.log(
  `\n${stats.written} users bina reconnect ke migrate ho jayenge.\n` +
  `${stats.noRefresh} ke paas refresh token nahi — unhe ek baar "Connect GMB" dabana padega.`,
);

await mongoose.disconnect();
