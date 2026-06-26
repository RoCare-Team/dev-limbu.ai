import { NextResponse } from "next/server";

const WHATSAPP_BASE_URL = "https://whatsapp.limbu.ai";

// GET /api/whatsapp/go?email=...
// Server-side SSO handoff: looks up a fresh handoff code and 302-redirects the
// user into the WhatsApp dashboard. The token/secret never appears in the URL.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.redirect(
        new URL("/dashboard?whatsapp=missing-email", req.url),
      );
    }

    const r = await fetch(
      `${WHATSAPP_BASE_URL}/api/auth/sso-login?email=${encodeURIComponent(email)}`,
      { headers: { "x-sso-secret": process.env.SSO_SHARED_SECRET || "" } },
    );

    const { data } = await r.json().catch(() => ({ data: {} }));

    if (data?.exists && data?.handoffCode) {
      return NextResponse.redirect(
        `${WHATSAPP_BASE_URL}/auth/sso?code=${encodeURIComponent(data.handoffCode)}`,
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard?whatsapp=notfound", req.url),
    );
  } catch (err) {
    console.error("WhatsApp SSO handoff error:", err);
    return NextResponse.redirect(new URL("/dashboard?whatsapp=error", req.url));
  }
}
