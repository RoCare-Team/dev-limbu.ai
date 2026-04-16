import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAdminBusinessModel,
  upsertLimbuChatBusinessLink,
} from "@/lib/adminBusinessStore";
import {
  chatbotPayloadFromGmbListings,
  postJsonWithRetry,
} from "@/lib/limbuGmbConnectChatbot";

export const dynamic = "force-dynamic";

/**
 * After connect-google-business "Continue": links `user_id` to saved GMB listings.
 * Response + webhook body: { status, message, locationsData, user_id }.
 *
 * Webhook: LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL (+ optional LIMBU_BUSINESS_CONNECTED_WEBHOOK_TOKEN).
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const userChatId = body.user_id?.toString()?.trim();
    if (!userChatId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const email = session.user.email.toLowerCase();
    const AdminBusiness = await getAdminBusinessModel();
    const doc = await AdminBusiness.findOne({ userEmail: email });
    const listings = Array.isArray(doc?.listings) ? doc.listings : [];

    await upsertLimbuChatBusinessLink(userChatId, email, listings);

    const chatbot = chatbotPayloadFromGmbListings(listings, userChatId);

    const hookUrl = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL?.trim();
    if (hookUrl) {
      const hookToken = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_TOKEN;
      const headers = { "Content-Type": "application/json" };
      if (hookToken) {
        headers.Authorization = `Bearer ${hookToken}`;
      }
      const result = await postJsonWithRetry(hookUrl, headers, chatbot);
      if (!result.ok) {
        console.error(
          "register-business-connection webhook failed after retry:",
          result.status
        );
      }
    }

    return NextResponse.json(chatbot, { status: 200 });
  } catch (error) {
    console.error("register-business-connection:", error);
    return NextResponse.json(
      { error: error?.message || "Register failed" },
      { status: 500 }
    );
  }
}
