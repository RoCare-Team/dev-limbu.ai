import User from "@/models/User";
import FranchiseTeam from "@/models/FranchiseTeam";
import FranchiseLeadSource from "@/models/FranchiseLeadSource";
import { getPlatform, slugifySourceName } from "@/lib/franchiseLeadSources";

/** Meta sends `field_data: [{name, values: []}]` — flatten to a plain object. */
export function flattenMetaFieldData(fieldData = []) {
  const out = {};
  fieldData.forEach((field) => {
    if (!field?.name) return;
    out[String(field.name).toLowerCase()] = Array.isArray(field.values)
      ? field.values[0]
      : field.values;
  });
  return out;
}

/** Pull name/email/phone out of whatever key casing the platform used. */
export function normalizeIncomingLead(raw = {}) {
  const pick = (...keys) => {
    for (const key of keys) {
      const value = raw[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return "";
  };

  return {
    fullName: pick("fullName", "full_name", "name", "full name", "leadName"),
    email: pick("email", "email_address", "work_email").toLowerCase(),
    phone: pick("phone", "phone_number", "phoneNumber", "mobile", "mobile_number"),
    city: pick("city", "town"),
    extra: raw,
  };
}

/** Digits only, so 91-98765 43210 and +919876543210 dedupe together. */
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Least-loaded active team member, tie-broken by who joined first — same rule
 * the manual "Add Lead" flow uses so assignment stays predictable.
 */
async function pickAssignee(source) {
  if (source.assignMode === "unassigned") return null;

  if (source.assignMode === "fixed") {
    if (!source.fixedAgentId) return null;
    return FranchiseTeam.findOne({
      _id: source.fixedAgentId,
      franchiseId: source.franchiseCode,
      isActive: true,
    })
      .select("fullName assignedLeads createdAt")
      .lean();
  }

  const members = await FranchiseTeam.find({
    franchiseId: source.franchiseCode,
    isActive: true,
    role: { $in: ["agent", "manager", "superFranchiseAdmin"] },
  })
    .select("fullName assignedLeads createdAt")
    .lean();

  if (!members.length) return null;

  return members.sort((a, b) => {
    const aCount = Array.isArray(a.assignedLeads) ? a.assignedLeads.length : 0;
    const bCount = Array.isArray(b.assignedLeads) ? b.assignedLeads.length : 0;
    if (aCount !== bCount) return aCount - bCount;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  })[0];
}

/**
 * Creates one franchise-panel lead from an external platform payload.
 *
 * Returns { status: "created" | "duplicate" | "invalid", user?, reason? }.
 * Never throws for bad input — callers ingest batches and report per-lead.
 */
export async function ingestFranchiseLead({ source, lead, externalId = null }) {
  const platform = getPlatform(source.platform);
  if (!platform) {
    return { status: "invalid", reason: "Unknown platform" };
  }

  const normalized = normalizeIncomingLead(lead);
  const phoneDigits = normalizePhone(normalized.phone);

  if (!normalized.email && !phoneDigits) {
    return { status: "invalid", reason: "Lead has neither email nor phone" };
  }

  const sourceSlug = slugifySourceName(source.name) || source.platform;

  // Platforms often omit email; synthesise a stable one so the unique index
  // and every downstream email lookup still have something to work with.
  const email =
    normalized.email || `${phoneDigits}@${sourceSlug || "lead"}.lead`;

  // ── Dedupe ────────────────────────────────────────────────────
  const dedupeOr = [{ email }];
  if (phoneDigits) dedupeOr.push({ phone: phoneDigits });
  if (externalId) dedupeOr.push({ metaLeadId: String(externalId) });

  const existing = await User.findOne({ $or: dedupeOr })
    .select("_id email phone")
    .lean();

  if (existing) {
    return { status: "duplicate", reason: "Lead already exists", user: existing };
  }

  const assignee = await pickAssignee(source);

  let user;
  try {
    user = await User.create({
      userId: `USR${Date.now()}${Math.floor(Math.random() * 1000)}`,
      fullName: normalized.fullName || normalized.email || phoneDigits || "Unnamed lead",
      email,
      phone: phoneDigits || undefined,
      referCode: source.franchiseCode,
      franchiseId: source.franchiseCode,
      assignedAgentId: assignee?._id,
      referredByAgentId: assignee?._id,
      referredByAgentName: assignee?.fullName || null,
      // "franchise-panel" keeps it inside the panel's lead filter; the slug
      // records which configured source produced it.
      leadTags: ["franchise-panel", sourceSlug],
      wallet: 500,
      freeUsedCount: 2,
      leadStage: source.defaultLeadStage || "Active",
      leadStatus: source.defaultLeadStatus || "",
      source: platform.source,
      metaLeadId: externalId ? String(externalId) : null,
      metaFormId: source.credentials?.formId || null,
      subscription: { plan: "", status: "active", date: new Date() },
    });
  } catch (error) {
    // Racing webhooks can both pass the dedupe check.
    if (error?.code === 11000) {
      return { status: "duplicate", reason: "Lead already exists" };
    }
    throw error;
  }

  if (assignee?._id) {
    await FranchiseTeam.findByIdAndUpdate(assignee._id, {
      $addToSet: { assignedLeads: user._id },
    });
  }

  return { status: "created", user };
}

/** Roll a batch result into the source's counters. */
export async function recordIngestStats(sourceId, { created, duplicates, error }) {
  const update = {
    $inc: {},
    $set: { lastError: error || "" },
  };

  if (created > 0) {
    update.$inc.totalLeads = created;
    update.$set.lastLeadAt = new Date();
  }
  if (duplicates > 0) {
    update.$inc.duplicateCount = duplicates;
  }
  if (!Object.keys(update.$inc).length) delete update.$inc;

  await FranchiseLeadSource.findByIdAndUpdate(sourceId, update);
}
