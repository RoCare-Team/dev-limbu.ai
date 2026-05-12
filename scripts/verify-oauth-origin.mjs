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

const snapshot = {
  BASE_URL: process.env.BASE_URL,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};
delete process.env.BASE_URL;
delete process.env.NEXT_PUBLIC_BASE_URL;
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.NEXT_PUBLIC_API_URL;

try {
  // From full request URL (no BASE_URL — request host wins)
  const a = resolveOAuthRedirectOrigin(mockReq("https://limbu.ai/api/facebook/callback?code=x"));
  assert(a === "https://limbu.ai", `expected https://limbu.ai got ${a}`);

  // www preserved
  const w = resolveOAuthRedirectOrigin(mockReq("https://www.limbu.ai/x"));
  assert(w === "https://www.limbu.ai", w);

  // Legacy: BASE_URL overrides proxy host (exact allowlist URL)
  process.env.BASE_URL = "https://config.example.com";
  const basePrefer = resolveOAuthRedirectOrigin(
    mockReq("https://localhost:3000/x", {
      "x-forwarded-host": "tenant.limbu.ai",
      "x-forwarded-proto": "https",
    }),
  );
  assert(basePrefer === "https://config.example.com", basePrefer);
  delete process.env.BASE_URL;

  // Proxied prod: no BASE_URL → forwarded host wins
  const proxied = resolveOAuthRedirectOrigin(
    mockReq("https://localhost:3000/api/facebook/login", {
      "x-forwarded-host": "tenant.limbu.ai",
      "x-forwarded-proto": "https",
    }),
  );
  assert(proxied === "https://tenant.limbu.ai", proxied);

  const multi = resolveOAuthRedirectOrigin(
    mockReq("https://localhost:3000/x", {
      "x-forwarded-host": "limbu.ai, limbu.ai",
      "x-forwarded-proto": "https",
    }),
  );
  assert(multi === "https://limbu.ai", multi);

  const b = resolveOAuthRedirectOrigin(
    mockReq(undefined, {
      host: "limbu.ai",
      "x-forwarded-proto": "https",
    }),
  );
  assert(b === "https://limbu.ai", b);

  // Production: BASE_URL wins over internal localhost req (no forwarded headers)
  process.env.BASE_URL = "https://app.example.com";
  const envWin = resolveOAuthRedirectOrigin(mockReq("https://localhost:3000/api/facebook/login"));
  assert(envWin === "https://app.example.com", envWin);
} finally {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

console.log("verify-oauth-origin: ok");
