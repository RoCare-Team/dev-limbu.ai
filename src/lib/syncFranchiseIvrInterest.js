import FranchiseIvrCall from "@/models/FranchiseIvrCall";
import { normalizePhoneForIvrMatch } from "@/utils/franchisePhoneMatch";

/**
 * From all IVR rows: normalized phone keys + earliest createdAt per key (for interest date).
 */
async function buildIvrPhoneKeySetAndFirstCallTimes() {
  const calls = await FranchiseIvrCall.find({})
    .select("did_number mobile_no caller_id_number createdAt")
    .lean();

  const keySet = new Set();
  const firstCallMs = new Map();

  for (const c of calls) {
    const t = c.createdAt ? new Date(c.createdAt).getTime() : null;
    const validT = t != null && !Number.isNaN(t) ? t : null;
    for (const field of [c.did_number, c.mobile_no, c.caller_id_number]) {
      const n = normalizePhoneForIvrMatch(field);
      if (!n) continue;
      keySet.add(n);
      if (validT != null) {
        const prev = firstCallMs.get(n);
        if (prev == null || validT < prev) firstCallMs.set(n, validT);
      }
    }
  }

  return { keySet, firstCallMs };
}

/**
 * Set ivrMeInterested on all franchise leads where normalized phone matches
 * any IVR did_number or caller number on record.
 */
export async function syncFranchiseLeadsIvrInterestFromCalls(LeadModel) {
  const { keySet: ivrKeySet, firstCallMs } =
    await buildIvrPhoneKeySetAndFirstCallTimes();

  const leads = await LeadModel.find({})
    .select("leadId phone ivrMeInterested ivrMeInterestedAt")
    .lean();

  const ops = [];
  for (const l of leads) {
    const n = normalizePhoneForIvrMatch(l.phone);
    const match = Boolean(n && ivrKeySet.has(n));
    if (match && !l.ivrMeInterested) {
      const ms = n ? firstCallMs.get(n) : null;
      const at = ms != null ? new Date(ms) : new Date();
      ops.push({
        updateOne: {
          filter: { leadId: l.leadId },
          update: {
            $set: { ivrMeInterested: true, ivrMeInterestedAt: at },
          },
        },
      });
    } else if (!match && l.ivrMeInterested) {
      ops.push({
        updateOne: {
          filter: { leadId: l.leadId },
          update: {
            $set: { ivrMeInterested: false, ivrMeInterestedAt: null },
          },
        },
      });
    } else if (
      match &&
      l.ivrMeInterested &&
      (l.ivrMeInterestedAt == null || l.ivrMeInterestedAt === "")
    ) {
      const ms = n ? firstCallMs.get(n) : null;
      const at = ms != null ? new Date(ms) : new Date();
      ops.push({
        updateOne: {
          filter: { leadId: l.leadId },
          update: { $set: { ivrMeInterestedAt: at } },
        },
      });
    }
  }

  if (ops.length > 0) {
    await LeadModel.bulkWrite(ops, { ordered: false });
  }
}

/**
 * After a new IVR webhook row, mark leads whose phone matches this value (DID or caller).
 * Sets ivrMeInterestedAt to the earliest of existing field and this event time.
 */
export async function markLeadsIvrInterestedForPhone(
  phoneRaw,
  LeadModel,
  interestedAt = new Date(),
) {
  const n = normalizePhoneForIvrMatch(phoneRaw);
  if (!n) return;

  const at =
    interestedAt instanceof Date ? interestedAt : new Date(interestedAt);
  if (Number.isNaN(at.getTime())) return;

  const candidates = await LeadModel.find({
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
    [
      {
        $set: {
          ivrMeInterested: true,
          ivrMeInterestedAt: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$ivrMeInterestedAt", null] },
                  { $not: ["$ivrMeInterestedAt"] },
                ],
              },
              then: at,
              else: { $min: ["$ivrMeInterestedAt", at] },
            },
          },
        },
      },
    ],
  );
}
