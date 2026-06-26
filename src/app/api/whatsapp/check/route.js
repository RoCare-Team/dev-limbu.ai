import { NextResponse } from "next/server";

const WHATSAPP_BASE_URL = "https://whatsapp.limbu.ai";

// GET /api/whatsapp/check?email=...
// Server-side SSO lookup. The shared secret never reaches the browser.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { exists: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const r = await fetch(
      `${WHATSAPP_BASE_URL}/api/auth/sso-login?email=${encodeURIComponent(email)}`,
      { headers: { "x-sso-secret": process.env.SSO_SHARED_SECRET || "" } },
    );

    const { data } = await r.json().catch(() => ({ data: {} }));

    return NextResponse.json({ exists: !!data?.exists });
  } catch (err) {
    console.error("WhatsApp SSO check error:", err);
    return NextResponse.json(
      { exists: false, error: err.message },
      { status: 500 },
    );
  }
}
