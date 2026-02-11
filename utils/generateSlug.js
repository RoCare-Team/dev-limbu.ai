export const generateSlug = (title, locality, address) => {
  return `${title}${locality ? `-${locality}` : ""}${address ? `-${address}` : ""}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
