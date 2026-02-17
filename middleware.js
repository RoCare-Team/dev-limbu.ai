import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Localhost case
  if (host.includes("localhost")) {
    return NextResponse.next();
  }

  const cleanHost = host.split(":")[0];
  const parts = cleanHost.split(".");

  // If main domain (limbu.ai) → no rewrite
  if (parts.length === 2) {
    return NextResponse.next();
  }

  // Extract subdomain
  const slug = parts[0];

  // Rewrite internally
  url.pathname = `/_sites/${slug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
