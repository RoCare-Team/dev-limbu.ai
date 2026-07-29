/**
 * Catalog of lead platforms a franchise can connect from the settings page.
 * Shared by the settings UI and the ingest/sync APIs so the "mandatory fields"
 * rule is defined once.
 *
 * `source` is the value written to User.source — it must stay inside the
 * User model's source enum, which is why it is not free text.
 */
export const LEAD_PLATFORMS = {
  meta: {
    label: "Meta Ads (Facebook / Instagram)",
    source: "Meta Leads",
    defaultName: "Meta Leads",
    supportsSync: true,
    /** Needed to pull leads from the Graph API on a schedule. */
    fields: [
      {
        key: "formId",
        label: "Lead Form ID",
        required: true,
        placeholder: "e.g. 1234567890123456",
        help: "Meta Business Suite → Instant Forms → your form ID.",
      },
      {
        key: "accessToken",
        label: "Page Access Token",
        required: true,
        secret: true,
        placeholder: "EAAG...",
        help: "A long-lived Page token with leads_retrieval permission.",
      },
      {
        key: "pageId",
        label: "Facebook Page ID",
        required: false,
        placeholder: "Optional",
      },
    ],
  },

  "google-ads": {
    label: "Google Ads Lead Form",
    source: "google-ads",
    defaultName: "Google Ads",
    supportsSync: false,
    fields: [
      {
        key: "formId",
        label: "Lead Form / Campaign Name",
        required: true,
        placeholder: "e.g. Kanpur-Search-Jan",
        help: "Used only to label where the lead came from.",
      },
    ],
  },

  website: {
    label: "Website / Landing Page Form",
    source: "website",
    defaultName: "Website Form",
    supportsSync: false,
    fields: [
      {
        key: "formId",
        label: "Form Name",
        required: true,
        placeholder: "e.g. Contact Us",
      },
    ],
  },

  whatsapp: {
    label: "WhatsApp",
    source: "whatsapp",
    defaultName: "WhatsApp",
    supportsSync: false,
    fields: [
      {
        key: "formId",
        label: "WhatsApp Number / Label",
        required: true,
        placeholder: "e.g. 9876543210",
      },
    ],
  },

  other: {
    label: "Other Platform",
    source: "other-platform",
    defaultName: "Other Platform",
    supportsSync: false,
    fields: [
      {
        key: "formId",
        label: "Platform Name",
        required: true,
        placeholder: "e.g. JustDial, Sulekha, Zapier",
      },
    ],
  },
};

export const PLATFORM_KEYS = Object.keys(LEAD_PLATFORMS);

export function getPlatform(key) {
  return LEAD_PLATFORMS[key] || null;
}

/** "Meta Leads" → "meta-leads" — used as the leadTags marker. */
export function slugifySourceName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validates a source config against its platform's mandatory fields.
 * Returns an array of human-readable problems (empty = valid).
 */
export function validateLeadSource(config = {}) {
  const errors = [];

  if (!String(config.name || "").trim()) {
    errors.push("Source name is required");
  }

  const platform = getPlatform(config.platform);
  if (!platform) {
    errors.push("Select a valid platform");
    return errors;
  }

  platform.fields
    .filter((field) => field.required)
    .forEach((field) => {
      if (!String(config.credentials?.[field.key] || "").trim()) {
        errors.push(`${field.label} is required`);
      }
    });

  return errors;
}
