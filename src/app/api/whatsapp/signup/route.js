import { NextResponse } from "next/server";

const WHATSAPP_BASE_URL = "https://whatsapp.limbu.ai";

// POST /api/whatsapp/signup
// Server-side proxy for WhatsApp signup. Keeps the external base URL and the
// upstream call off the browser; returns a handoff code for the SSO redirect.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, workspaceName } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 },
      );
    }

    const r = await fetch(`${WHATSAPP_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || email.split("@")[0],
        email,
        password,
        workspaceName: workspaceName || `${name || "My"} Business`,
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok || data.success === false) {
      const msg = data.error || data.message || "WhatsApp signup failed";
      return NextResponse.json(
        { success: false, error: msg },
        { status: r.status || 400 },
      );
    }

    const handoffCode = data?.data?.handoffCode;

    if (!handoffCode) {
      return NextResponse.json(
        { success: false, error: "Signup succeeded but no handoff code received" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, handoffCode });
  } catch (err) {
    console.error("WhatsApp signup error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected error while connecting WhatsApp" },
      { status: 500 },
    );
  }
}
