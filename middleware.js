import { NextResponse } from "next/server";

/** Vercel / proxies often send the public host here first */
function getCleanHostname(request) {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.split(":")[0].toLowerCase();
  }
  const host = request.headers.get("host") || "";
  return host.split(":")[0].toLowerCase();
}

export function middleware(request) {
  const cleanHost = getCleanHostname(request);
  const url = request.nextUrl.clone();

  // 🔒 NEVER touch main domain
  if (
    cleanHost === "limbu.ai" ||
    cleanHost === "www.limbu.ai"
  ) {
    return NextResponse.next();
  }

  // 🔒 NEVER touch CRM
  if (cleanHost === "crm.limbu.ai") {
    return NextResponse.next();
  }

  // ✅ Only rewrite real *.limbu.ai tenant hosts
  if (cleanHost.endsWith(".limbu.ai")) {
    const slug = cleanHost.replace(/\.limbu\.ai$/i, "");

    if (!slug || slug === "www" || slug === "crm") {
      return NextResponse.next();
    }

    // Single-segment [slug] route: tenant microsite (see src/app/[slug]/page.jsx)
    url.pathname = `/${slug}`;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-is-subdomain-site", "1");
    requestHeaders.set("x-tenant-slug", slug);

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

/**
 * Include "/" explicitly — without it, requests to https://tenant.limbu.ai/
 * never hit middleware, so the marketing home page was served instead of the
 * rewritten /[slug] tenant site.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)",
    "/",
  ],
};
