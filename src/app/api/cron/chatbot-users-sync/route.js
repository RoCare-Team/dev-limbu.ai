import { NextResponse } from "next/server";
import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import { syncChatbotUsersToApp } from "@/lib/limbuBotUserSync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    const isCronAuthOk =
      isVercelCron ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthOk) {
      await dbConnect();
      const adminEmail = searchParams.get("email");
      if (!adminEmail) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      const admin = await Admin.findOne({ email: adminEmail }).select("role");
      if (!admin || !["superAdmin", "admin"].includes(admin.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const maxToInsert = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30),
    );

    const stats = await syncChatbotUsersToApp({ maxToInsert });

    return NextResponse.json({
      success: true,
      message: "Chatbot users synced to app registration",
      stats,
    });
  } catch (err) {
    console.error("[chatbot-users-sync]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 },
    );
  }
}
