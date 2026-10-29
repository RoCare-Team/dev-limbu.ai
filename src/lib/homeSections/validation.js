import * as C from "./constants";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function validateIcon(icon, path, errors) {
  if (!icon || typeof icon !== "object") {
    errors.push(`${path} is required`);
    return;
  }
  if (!C.ICON_TYPES.includes(icon.type)) {
    errors.push(`${path}.type must be one of: ${C.ICON_TYPES.join(", ")}`);
    return;
  }
  if (icon.type === "brand" && !C.BRAND_ICONS.includes(icon.value)) {
    errors.push(`${path}.value must be one of: ${C.BRAND_ICONS.join(", ")}`);
  }
  if (icon.type === "material" && !C.MATERIAL_ICONS.includes(icon.value)) {
    errors.push(`${path}.value must be one of: ${C.MATERIAL_ICONS.join(", ")}`);
  }
  if (icon.type === "image" && !/^https:\/\//.test(icon.value || "")) {
    errors.push(`${path}.value must be an https image URL`);
  }
}

function validateAction(action, path, errors) {
  if (!action || typeof action !== "object") {
    errors.push(`${path} is required`);
    return;
  }
  const allowed = {
    feature: C.FEATURE_ACTIONS,
    plans: C.PLAN_TABS,
    all_services: C.SERVICE_SECTIONS,
  };
  if (!C.ACTION_TYPES.includes(action.type)) {
    errors.push(`${path}.type must be one of: ${C.ACTION_TYPES.join(", ")}`);
    return;
  }
  if (action.type === "url") {
    if (!/^https:\/\//.test(action.value || "")) {
      errors.push(`${path}.value must be an https URL`);
    }
    return;
  }
  if (!allowed[action.type].includes(action.value)) {
    errors.push(
      `${path}.value must be one of: ${allowed[action.type].join(", ")}`
    );
  }
}

function validateAccess(access, path, errors) {
  if (access == null) return;
  if (typeof access !== "object") {
    errors.push(`${path} must be an object`);
    return;
  }
  if (
    access.includedInPlans != null &&
    (!Array.isArray(access.includedInPlans) ||
      !access.includedInPlans.every(isNonEmptyString))
  ) {
    errors.push(`${path}.includedInPlans must be an array of plan names`);
  }
  if (access.freeForAll != null && typeof access.freeForAll !== "boolean") {
    errors.push(`${path}.freeForAll must be true or false`);
  }
  if (
    access.freeLimit != null &&
    !(Number.isInteger(access.freeLimit) && access.freeLimit >= 0)
  ) {
    errors.push(`${path}.freeLimit must be a whole number (0 or more)`);
  }
  if (access.visibleTo != null && !C.VISIBILITY.includes(access.visibleTo)) {
    errors.push(`${path}.visibleTo must be one of: ${C.VISIBILITY.join(", ")}`);
  }
}

function validatePricing(pricing, path, errors) {
  if (pricing == null) return;
  if (typeof pricing !== "object") {
    errors.push(`${path} must be an object`);
    return;
  }
  const isPositiveInt = (v) => Number.isInteger(v) && v > 0;
  if (!isPositiveInt(pricing.coinsPerSecond)) {
    errors.push(`${path}.coinsPerSecond must be a whole number above 0`);
  }
  for (const field of ["minSeconds", "maxSeconds", "stepSeconds"]) {
    if (pricing[field] != null && !isPositiveInt(pricing[field])) {
      errors.push(`${path}.${field} must be a whole number above 0`);
    }
  }
  if (
    isPositiveInt(pricing.minSeconds) &&
    isPositiveInt(pricing.maxSeconds) &&
    pricing.minSeconds > pricing.maxSeconds
  ) {
    errors.push(`${path}.minSeconds must not be more than maxSeconds`);
  }
}

/**
 * Validates a full section body (create / update).
 * Returns an array of error strings; empty array means valid.
 */
export function validateSection(body) {
  const errors = [];
  if (!body || typeof body !== "object") return ["Request body is required"];

  if (!isNonEmptyString(body.key)) errors.push("key is required");
  if (!isNonEmptyString(body.title)) errors.push("title is required");
  validateIcon(body.icon, "icon", errors);
  if (body.viewAll != null) validateAction(body.viewAll, "viewAll", errors);
  if (body.order != null && !Number.isFinite(body.order)) {
    errors.push("order must be a number");
  }

  if (!Array.isArray(body.items)) {
    errors.push("items must be an array");
    return errors;
  }

  const seenKeys = new Set();
  body.items.forEach((item, i) => {
    const p = `items[${i}]`;
    if (!isNonEmptyString(item.key)) errors.push(`${p}.key is required`);
    else if (seenKeys.has(item.key)) errors.push(`${p}.key "${item.key}" is duplicated`);
    else seenKeys.add(item.key);

    if (!isNonEmptyString(item.label)) errors.push(`${p}.label is required`);
    validateIcon(item.icon, `${p}.icon`, errors);
    validateAction(item.action, `${p}.action`, errors);
    if (item.badge != null && !C.BADGES.includes(item.badge)) {
      errors.push(`${p}.badge must be null or one of: ${C.BADGES.join(", ")}`);
    }
    if (item.comingSoon != null && typeof item.comingSoon !== "boolean") {
      errors.push(`${p}.comingSoon must be true or false`);
    }
    if (
      item.coinCost != null &&
      !(Number.isInteger(item.coinCost) && item.coinCost >= 0)
    ) {
      errors.push(`${p}.coinCost must be a whole number (0 or more)`);
    }
    validatePricing(item.pricing, `${p}.pricing`, errors);
    validateAccess(item.access, `${p}.access`, errors);
  });

  return errors;
}

