export const generateSlug = (title, locality) => {
  const parts = [];

  if (title) parts.push(String(title).trim());
  if (locality) parts.push(String(locality).trim());

  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};