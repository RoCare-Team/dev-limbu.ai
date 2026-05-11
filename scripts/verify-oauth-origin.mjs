/**
 * Quick sanity check for OAuth redirect origin resolution (no Jest in repo).
 * Run: node scripts/verify-oauth-origin.mjs
 */
import { resolveOAuthRedirectOrigin } from "../src/lib/oauthRedirectOrigin.js";

function mockReq(url, headerMap = {}) {
  return {
    url,
    headers: {
      get: (name) => headerMap[String(name).toLowerCase()] ?? null,
    },
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// From full request URL
const a = resolveOAuthRedirectOrigin(mockReq("https://limbu.ai/api/facebook/callback?code=x"));
assert(a === "https://limbu.ai", `expected https://limbu.ai got ${a}`);

// www preserved
const w = resolveOAuthRedirectOrigin(mockReq("https://www.limbu.ai/x"));
assert(w === "https://www.limbu.ai", w);

// Proxy headers (no req.url): ignore env for this assertion
const savedBase = process.env.BASE_URL;
const savedSite = process.env.NEXT_PUBLIC_SITE_URL;
const savedApi = process.env.NEXT_PUBLIC_API_URL;
delete process.env.BASE_URL;
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.NEXT_PUBLIC_API_URL;
try {
  const b = resolveOAuthRedirectOrigin(
    mockReq(undefined, {
      host: "limbu.ai",
      "x-forwarded-proto": "https",
    }),
  );
  assert(b === "https://limbu.ai", b);
} finally {
  if (savedBase !== undefined) process.env.BASE_URL = savedBase;
  if (savedSite !== undefined) process.env.NEXT_PUBLIC_SITE_URL = savedSite;
  if (savedApi !== undefined) process.env.NEXT_PUBLIC_API_URL = savedApi;
}

console.log("verify-oauth-origin: ok");
