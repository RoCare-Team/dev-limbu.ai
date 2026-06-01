import { NextResponse } from "next/server";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";
import { buildGmbOAuthState } from "@/lib/gmbOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");
    let userId = userIdParam;
    const phoneRaw = url.searchParams.get("phone");
    const source = (url.searchParams.get("source") || "dashboard").toLowerCase();
    const mobile = url.searchParams.get("mobile") === "true";

    if (!userId && phoneRaw) {
      userId = await resolveDashboardUserIdByPhone(phoneRaw);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId or phone is required" },
        { status: 400 },
      );
    }

    const baseUrl = resolveOAuthRedirectOrigin(req, { preferRequestOrigin: true });
    const redirectUri = `${baseUrl}/api/gmb/callback`;
    const state = buildGmbOAuthState({
      userId,
      phone: phoneRaw,
      source,
      mobile,
    });

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile https://www.googleapis.com/auth/business.manage",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  } catch (error) {
    console.error("GMB Login Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Google Business login URL" },
      { status: 500 },
    );
  }
}
