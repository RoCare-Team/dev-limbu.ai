export const generateSlug = (title, locality, address) => {
  // Build parts to make slugs like: mannu-bhai-service-expert-surat-u-24-someswar-square-building-vesu
  const parts = [];

  if (title) parts.push(String(title).trim());

  // Insert descriptive tokens to make business slugs more discoverable
  // e.g. "service-expert" — you can adjust or remove if undesired
  parts.push("service-expert");

  if (locality) parts.push(String(locality).trim());

  // Add address information if available (shortened version)
  if (address) {
    // Take first part of address and clean it
    const addressPart = String(address).split(',')[0].trim();
    if (addressPart && addressPart.length > 3) {
      parts.push(addressPart);
    }
  }

  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
