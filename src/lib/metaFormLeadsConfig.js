/**
 * Meta Lead Form → import settings (tags, default name, round-robin pool).
 * Cron / manual sync: GET /api/meta-leads-import?formId=<id>
 */

export const META_REAL_ESTATE_FORM_ID = "1092789519760679";
export const META_REAL_ESTATE_LEGACY_FORM_ID = "2376363326181673";
export const META_REAL_ESTATE_SURVEY_FORM_ID = "37110369011883462";
export const META_FRANCHISE_FORM_ID = "1987842758631115";
export const META_DEFAULT_FORM_ID = "1344734835382149";

/** @type {Record<string, { leadTags: string[], source: string, defaultName: string, roundRobinKey?: string }>} */
export const META_FORM_CONFIGS = {
  [META_DEFAULT_FORM_ID]: {
    leadTags: ["metaleads"],
    source: "Meta Lead",
    defaultName: "Meta Lead",
    roundRobinKey: "agentLeadRR",
  },
  [META_REAL_ESTATE_FORM_ID]: {
    leadTags: ["real-estate-lead"],
    source: "Meta Lead",
    defaultName: "Real Estate Lead",
    roundRobinKey: "agentLeadRR",
  },
  [META_REAL_ESTATE_LEGACY_FORM_ID]: {
    leadTags: ["real-estate-lead"],
    source: "Meta Lead",
    defaultName: "Real Estate Lead",
    roundRobinKey: "agentLeadRR",
  },
  [META_REAL_ESTATE_SURVEY_FORM_ID]: {
    leadTags: ["real-estate-lead"],
    source: "Real estate leads",
    defaultName: "Real Estate Lead",
    roundRobinKey: "agentLeadRR",
  },
  [META_FRANCHISE_FORM_ID]: {
    leadTags: ["franchise-lead"],
    source: "Meta Lead",
    defaultName: "Franchise Lead",
    roundRobinKey: "agentLeadRR",
  },
};

export const META_FORM_SYNC_IDS = Object.keys(META_FORM_CONFIGS);

/** Stored `User.leadTags` values that count as Meta / instant-form leads */
export const META_LEAD_TAG_KEYS = [ "metaleads"];

export function getMetaFormConfig(formId) {
  const id = String(formId || "").trim();
  if (META_FORM_CONFIGS[id]) return META_FORM_CONFIGS[id];
  return {
    leadTags: ["metaleads"],
    source: "Meta Lead",
    defaultName: "Meta Lead",
    roundRobinKey: "agentLeadRR",
  };
}
