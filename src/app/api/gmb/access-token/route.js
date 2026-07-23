import { NextResponse } from "next/server";
import { getGmbSession } from "@/lib/gmbSession";

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
  const session = await getGmbSession(request);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!session.accessToken) {
    return NextResponse.json(
      { error: "GMB not connected", code: "GMB_NOT_CONNECTED" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    email: session.user.email,
  });
}
