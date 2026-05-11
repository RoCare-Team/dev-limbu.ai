import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";

export const dynamic = "force-dynamic";

/**
 * GET /api/meta/resolve-user?phone=917740847114
 * Maps chatbot/WA phone → dashboard userId used by /api/facebook|instagram/login state.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizeMetaPhoneDigits(searchParams.get("phone") || "");

    if (!phone) {
      return NextResponse.json(
        { error: "phone query parameter is required" },
        { status: 400 }
      );
    }

    const userId = await resolveDashboardUserIdByPhone(phone);
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "No dashboard account found for this number. Log in once with OTP on Limbu.ai (same phone), then retry.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, userId }, { status: 200 });
  } catch (e) {
    console.error("[meta/resolve-user]:", e);
    return NextResponse.json(
      { error: "Could not resolve user" },
      { status: 500 }
    );
  }
}
