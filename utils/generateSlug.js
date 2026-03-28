/** Must match build-website `createSlug` (title + locality + address line). */
export const generateSlug = (title, locality, address) => {
  const parts = [];

  if (title) parts.push(String(title).trim());
  if (locality) parts.push(String(locality).trim());
  if (address) parts.push(String(address).trim());

  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};