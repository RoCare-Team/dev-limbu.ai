/**
 * Small Meta Graph API client for the social automation features (insights,
 * comment / DM auto reply, negative comment moderation). Server-only.
 */

export const GRAPH_VERSION = "v24.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class GraphError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Calls the Graph API. `params` go in the query string for GET and in the
 * form body otherwise. Throws GraphError with Meta's message on failure.
 */
export async function graph(path, token, { method = "GET", params = {} } = {}) {
  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  const body = new URLSearchParams();
  const target = method === "GET" ? url.searchParams : body;
  for (const [k, v] of Object.entries({ ...params, access_token: token })) {
    if (v !== undefined && v !== null) target.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(url, {
    method,
    ...(method === "GET" ? {} : { body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GraphError(data.error?.message || `Graph API ${res.status}`, { code: data.error?.code, status: res.status });
  }
  return data;
}

/** Same as graph() but returns null instead of throwing (optional data like insights). */
export async function graphSafe(path, token, opts) {
  try {
    return await graph(path, token, opts);
  } catch {
    return null;
  }
}

/** Permissions the user granted to the app: Set of names with status "granted". */
export async function grantedPermissions(userAccessToken) {
  if (!userAccessToken) return new Set();
  const data = await graphSafe("me/permissions", userAccessToken);
  return new Set((data?.data || []).filter((p) => p.status === "granted").map((p) => p.permission));
}

/** Permissions each automation feature needs, per platform. */
export const FEATURE_PERMISSIONS = {
  insights: { facebook: ["read_insights"], instagram: ["instagram_manage_insights"] },
  comments: { facebook: ["pages_manage_engagement", "pages_read_user_content"], instagram: ["instagram_manage_comments"] },
  dms: { facebook: ["pages_messaging"], instagram: ["instagram_manage_messages"] },
  moderation: { facebook: ["pages_manage_engagement", "pages_read_user_content"], instagram: ["instagram_manage_comments"] },
};

/** Extra OAuth scopes asked for when the user turns automation on (incremental auth). */
export const AUTOMATION_SCOPES = {
  facebook: ["read_insights", "pages_manage_engagement", "pages_read_user_content", "pages_messaging"],
  instagram: ["instagram_manage_insights", "instagram_manage_comments", "instagram_manage_messages", "pages_manage_metadata"],
};
