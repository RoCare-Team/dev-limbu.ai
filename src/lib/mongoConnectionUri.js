/**
 * Mongoose / MongoClient URI: append database name when MONGODB_URI has no path.
 *
 * Examples:
 * - mongodb://13.200.192.11:27017 → mongodb://13.200.192.11:27017/gmb_dashboard
 * - mongodb://127.0.0.1:27017/mydb → unchanged
 *
 * Override default DB with MONGODB_DB_NAME (e.g. "test" for restores from a test dump).
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
