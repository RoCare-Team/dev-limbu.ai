import { NextResponse } from "next/server";


/**
 * Middleware for handling dynamic subdomain routing
 * - Detects *.limbu.ai subdomains
 * - Supports custom domains registered to sites
 * - Routes to /live/[slug] for rendering
 */
export function middleware(req) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // Skip middleware for localhost and API routes
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return NextResponse.next();
  }

  // Extract the subdomain
  const parts = host.split(".");
  const subdomain = parts[0];

  // List of reserved subdomains that should not trigger subdomain routing
  const reservedSubdomains = [
    "limbu",
    "www",
    "admin",
    "api",
    "mail",
    "ftp",
    "email",
    "@",
    "*",
  ];

  // If subdomain is reserved or host is the main domain, proceed normally
  if (
    reservedSubdomains.includes(subdomain) ||
    host === "limbu.ai" ||
    !subdomain
  ) {
    return NextResponse.next();
  }

  // Validate subdomain format (alphanumeric and hyphens only, no consecutive hyphens)
  const isValidSubdomain = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(
    subdomain
  );

  if (!isValidSubdomain) {
    return NextResponse.next();
  }

  // Check if this is a limbu.ai subdomain or custom domain
  const isLimbuSubdomain = host.endsWith(".limbu.ai");
  const baseUrl = isLimbuSubdomain
    ? `https://limbu.ai`
    : `https://${host.replace(subdomain, "")}`;

  // Rewrite to the /live/[slug] route
  url.pathname = `/live/${subdomain}`;
  return NextResponse.rewrite(url);
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  // Apply middleware to all routes except:
  // - _next/* (Next.js internals)
  // - *.jpg, *.png, *.gif, etc. (static assets)
  // - /api/* (API routes handle themselves if needed)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
