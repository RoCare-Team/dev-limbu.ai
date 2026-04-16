import { NextResponse } from "next/server";
import { findLimbuChatBusinessLinkByUserChatId } from "@/lib/adminBusinessStore";
import { chatbotPayloadFromLinkRow } from "@/lib/limbuGmbConnectChatbot";

export const dynamic = "force-dynamic";

/**
 * Poll last connect outcome for a chat user (same contract as register + webhook).
 *
 * GET /api/limbu/connected-business?user_id=<uuid>
 * Optional: LIMBU_CHAT_STATUS_TOKEN via ?token= or Authorization: Bearer
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
    return NextResponse.json({
      ...chatbot,
      ...(row?.updatedAt && { updatedAt: row.updatedAt }),
    });
  } catch (error) {
    console.error("connected-business GET:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load connected business" },
      { status: 500 }
    );
  }
}
