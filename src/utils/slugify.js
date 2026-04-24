/**
 * Generates a unique slug for a business listing based on title, locality, and sub-locality.
 * This is the universal slug generator for LimbuAI.
 * 
 * @param {Object} listing - The business listing object
 * @returns {string} - The generated slug
 */
export const generateUniversalSlug = (listing) => {
  if (!listing) return "";

  const title = listing.title || listing.locationName || "";
  const locality =
    listing.address?.locality ||
    listing.storefrontAddress?.locality ||
    listing.profile?.address?.locality ||
    "";

  const addressLines =
    listing.address?.addressLines ||
    listing.storefrontAddress?.addressLines ||
    [];

  // Extract sub-locality (e.g., "Maninagar" from the end of the address)
  let subLocality = "";
  if (addressLines.length > 0) {
    const lastLine = addressLines[addressLines.length - 1] || "";
    const parts = lastLine.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length > 0) {
      subLocality = parts[parts.length - 1];
    }
  }

  // Clean and combine
  const combined = `${title}${locality ? `-${locality}` : ""}${subLocality ? `-${subLocality}` : ""}`;

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
