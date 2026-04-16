import { NextResponse } from "next/server";
import { findLimbuChatBusinessLinkByUserChatId } from "@/lib/adminBusinessStore";
import { chatbotPayloadFromLinkRow } from "@/lib/limbuGmbConnectChatbot";

export const dynamic = "force-dynamic";

/**
 * Same connect outcome as GET /api/limbu/connected-business, plus legacy aliases.
 *
 * GET /api/limbu/business-connection?user_id=<uuid>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id")?.trim();
    const tokenFromQuery = searchParams.get("token")?.trim();
    const authHeader = request.headers.get("authorization") || "";
    const tokenFromBearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token = tokenFromQuery || tokenFromBearer;

    const expected = process.env.LIMBU_CHAT_STATUS_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id query parameter is required" },
        { status: 400 }
      );
    }

    const row = await findLimbuChatBusinessLinkByUserChatId(userId);
    const chatbot = chatbotPayloadFromLinkRow(row, userId);
    const ok = chatbot.status === "success";

    return NextResponse.json({
      ...chatbot,
      success: true,
      connected: ok,
      connectionSuccess: ok,
      listingsCount: chatbot.locationsData.length,
      businesses: chatbot.locationsData,
      displayMessage: chatbot.message,
      message: chatbot.message,
      ...(row?.updatedAt && { updatedAt: row.updatedAt }),
    });
  } catch (error) {
    console.error("business-connection GET:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load status" },
      { status: 500 }
    );
  }
}
