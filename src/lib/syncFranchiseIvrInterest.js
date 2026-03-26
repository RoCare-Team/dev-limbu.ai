import FranchiseIvrCall from "@/models/FranchiseIvrCall";
import { normalizePhoneForIvrMatch } from "@/utils/franchisePhoneMatch";

/**
 * Build normalized phone keys from IVR rows: did_number (as requested) plus
 * caller identifiers so lead.phone can match the person who called.
 */
async function buildIvrPhoneKeySet() {
  const [dids, mobiles, callers] = await Promise.all([
    FranchiseIvrCall.distinct("did_number", {
      did_number: { $exists: true, $nin: [null, ""] },
    }),
    FranchiseIvrCall.distinct("mobile_no", {
      mobile_no: { $exists: true, $nin: [null, ""] },
    }),
    FranchiseIvrCall.distinct("caller_id_number", {
      caller_id_number: { $exists: true, $nin: [null, ""] },
    }),
  ]);
  const set = new Set();
  for (const v of [...dids, ...mobiles, ...callers]) {
    const n = normalizePhoneForIvrMatch(v);
    if (n) set.add(n);
  }
  return set;
}

/**
 * Set ivrMeInterested on all franchise leads where normalized phone matches
 * any IVR did_number or caller number on record.
 */
export async function syncFranchiseLeadsIvrInterestFromCalls(LeadModel) {
  const ivrKeySet = await buildIvrPhoneKeySet();

  const leads = await LeadModel.find({})
    .select("leadId phone ivrMeInterested")
    .lean();

  const ops = [];
  for (const l of leads) {
    const n = normalizePhoneForIvrMatch(l.phone);
    const match = Boolean(n && ivrKeySet.has(n));
    if (match && !l.ivrMeInterested) {
      ops.push({
        updateOne: {
          filter: { leadId: l.leadId },
          update: { $set: { ivrMeInterested: true } },
        },
      });
    } else if (!match && l.ivrMeInterested) {
      ops.push({
        updateOne: {
          filter: { leadId: l.leadId },
          update: { $set: { ivrMeInterested: false } },
        },
      });
    }
  }

  if (ops.length > 0) {
    await LeadModel.bulkWrite(ops, { ordered: false });
  }
}

/** After a new IVR webhook row, mark leads whose phone matches this value (DID or caller). */
export async function markLeadsIvrInterestedForPhone(phoneRaw, LeadModel) {
  const n = normalizePhoneForIvrMatch(phoneRaw);
  if (!n) return;

  const candidates = await LeadModel.find({
    ivrMeInterested: { $ne: true },
    phone: { $exists: true, $nin: [null, ""] },
  })
    .select("leadId phone")
    .lean();

  const ids = candidates
    .filter((l) => normalizePhoneForIvrMatch(l.phone) === n)
    .map((l) => l.leadId);

  if (ids.length === 0) return;

  await LeadModel.updateMany(
    { leadId: { $in: ids } },
    { $set: { ivrMeInterested: true } }
  );
}
