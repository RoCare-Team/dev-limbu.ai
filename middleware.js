import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  const cleanHost = host.split(":")[0];

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

  // ✅ Only rewrite real subdomains
  if (cleanHost.endsWith(".limbu.ai")) {
    const slug = cleanHost.replace(".limbu.ai", "");

    // extra safety
    if (!slug || slug === "www" || slug === "crm") {
      return NextResponse.next();
    }

    url.pathname = `/${slug}`;

    // Pass a request header so the root layout can skip AuthGuard server-side
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-is-subdomain-site", "1");

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
