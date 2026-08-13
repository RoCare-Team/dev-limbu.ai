import mongoose from "mongoose";
import Admin from "@/models/Admin";
import User from "@/models/User";

/**
 * Lead → agent assignment (shared by every lead source).
 *
 * Pehle plain round-robin counter tha. Uska problem: counter global hai aur
 * un paths se bhi bump hota hai jo naya lead nahi banati, aur agent add/remove
 * hone par array ki length badal jaati hai. Isse koi ek agent lambe samay tak
 * skip ho sakta hai (Anjali ke saath yahi hua — 20 Jul se ek bhi naya lead nahi).
 *
 * Ab least-loaded assignment hai: pichhle BALANCE_WINDOW_HOURS mein jis active
 * agent ke paas sabse kam leads hain use agla lead milta hai. Isse naya ya
 * dobara-active hua agent apne aap catch up kar leta hai aur koi starve nahi
 * hota. Window rolling hai isliye purane lifetime totals se burst nahi aata.
 */

const BALANCE_WINDOW_HOURS = 24;

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: -1 },
});
const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

const RR_KEY = "agentLeadRR";

/** Tie-break ke liye counter — barabar load wale agents mein rotate karta hai. */
async function bumpTieBreaker() {
  const doc = await Setting.findOneAndUpdate(
    { key: RR_KEY },
    [
      {
        $set: {
          key: RR_KEY,
          value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
        },
      },
    ],
    { new: true, upsert: true },
  );
  let value = parseInt(doc?.value, 10);
  if (!Number.isFinite(value) || value < 0) value = 0;
  return value;
}

/**
 * Sirf wahi agents jinhe naya lead milna chahiye.
 * `leadsEnabled: false` wale agent ko admin (ya khud agent) ne lead lena band
 * kiya hai — wo pool se bahar rehta hai. Purane docs me field hai hi nahi,
 * isliye `$ne: false` (default = enabled).
 */
export async function getActiveAgents() {
  return Admin.find({
    role: "agent",
    isActive: true,
    leadsEnabled: { $ne: false },
  })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}

/**
 * Agla lead jis agent ko jaana chahiye uska poora doc return karta hai.
 * Koi active agent na ho to null.
 *
 * @param {object[]} [agents] - pehle se fetched active agents (optional)
 */
export async function pickAgentForLead(agents) {
  const activeAgents = agents?.length ? agents : await getActiveAgents();
  if (!activeAgents.length) {
    console.warn(
      "[LeadAssign] ⚠️ Koi active agent nahi mila (role:agent, isActive:true)",
    );
    return null;
  }

  const since = new Date(Date.now() - BALANCE_WINDOW_HOURS * 3600 * 1000);
  const agentIds = activeAgents.map((a) => a._id);

  const recent = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        assignedAgentId: { $in: agentIds },
      },
    },
    { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
  ]);

  const loadById = new Map(
    recent.map((row) => [String(row._id), Number(row.count) || 0]),
  );

  let minLoad = Infinity;
  for (const agent of activeAgents) {
    const load = loadById.get(String(agent._id)) || 0;
    if (load < minLoad) minLoad = load;
  }

  // Sabse kam load wale agents — inme counter se rotate karo taaki barabar
  // load par bhi baar-baar wahi agent na chune jaaye.
  const candidates = activeAgents.filter(
    (agent) => (loadById.get(String(agent._id)) || 0) === minLoad,
  );

  const tieBreaker = await bumpTieBreaker();
  const chosen = candidates[tieBreaker % candidates.length];

  console.log(
    `[LeadAssign] ✅ ${chosen.fullName || chosen.email} | load(${BALANCE_WINDOW_HOURS}h)=${minLoad} | tied=${candidates.length}/${activeAgents.length} | loads: ${activeAgents
      .map((a) => `${a.fullName || a.email}:${loadById.get(String(a._id)) || 0}`)
      .join(", ")}`,
  );

  return chosen;
}

/** pickAgentForLead ka shortcut jab sirf _id chahiye. */
export async function pickAgentIdForLead(agents) {
  const agent = await pickAgentForLead(agents);
  return agent?._id || null;
}
