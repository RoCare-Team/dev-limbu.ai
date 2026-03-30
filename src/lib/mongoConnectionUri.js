/**
 * Mongoose connection URI: use gmb_dashboard when MONGODB_URI has no DB path
 * (matches native driver usage: client.db("gmb_dashboard")).
 * Override with MONGODB_DB_NAME (e.g. "test" for local experiments).
 */
const DEFAULT_DB = process.env.MONGODB_DB_NAME || "gmb_dashboard";

export function mongooseConnectionUri(rawUri) {
  if (!rawUri) return rawUri;
  // ...host:port/dbname — already has a database name in the path
  if (/\/\/[^/]+\/[^/?]+/.test(rawUri)) return rawUri;
  const q = rawUri.indexOf("?");
  const base = (q === -1 ? rawUri : rawUri.slice(0, q)).replace(/\/$/, "");
  const qs = q === -1 ? "" : rawUri.slice(q);
  return `${base}/${DEFAULT_DB}${qs}`;
}
