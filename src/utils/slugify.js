/**
 * Generates a stable review slug based on title + locality + street line.
 *
 * @param {Object} listing
 * @returns {string}
 */
export const generateUniversalSlug = (listing) => {
  if (!listing) return "";

  const title = listing.title || listing.locationName || "";
  const locality =
    listing.address?.locality ||
    listing.storefrontAddress?.locality ||
    listing.locality ||
    listing.profile?.address?.locality ||
    "";

  const streetLineRaw =
    listing.addressLine ||
    listing.storefrontAddress?.addressLines?.[0] ||
    listing.address?.addressLines?.[0] ||
    (typeof listing.address === "string" ? listing.address.split(",")[0] : "") ||
    "";

  const streetLine = String(streetLineRaw).trim();
  const combined = `${title}${locality ? `-${locality}` : ""}${streetLine ? `-${streetLine}` : ""}`;

  return combined
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/-+/g, "-") // Remove double -
    .replace(/^-|-$/g, ""); // Trim leading/trailing -
};

/**
 * Basic string to slug helper
 */
export const stringToSlug = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
