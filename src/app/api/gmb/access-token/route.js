import { NextResponse } from "next/server";
import { requireGmbSession } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

/**
 * Fresh Google access token — sirf un legacy client code paths ke liye jo token
 * kisi external service ko dete hain (jaise gmb-auditor).
 *
 * NOTE: pehle NextAuth `session.accessToken` browser me waise bhi expose karta
 * tha, isliye ye koi nayi exposure nahi hai. Aage in call sites ko server-side
 * proxy par le jaana chahiye (dashboard insights ki tarah), phir ye route hata
 * dena — dekho /api/gmb/location-insights.
 */
export async function GET(request) {
  const { session, error } = await requireGmbSession(request);
  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  return NextResponse.json({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    email: session.user.email,
  });
}
