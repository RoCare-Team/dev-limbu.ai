import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { getChatbotChatsByDay } from "@/lib/limbuBotUserSync";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email required" },
        { status: 400 },
      );
    }

    await dbConnect();
    const admin = await Admin.findOne({ email: adminEmail }).select("role");
    if (
      !admin ||
      !["superAdmin", "admin", "superfranchiseAdmin", "agent"].includes(
        admin.role,
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const dayStats = await getChatbotChatsByDay();

    return NextResponse.json({
      success: true,
      timeZone: dayStats.timeZone,
      today: {
        count: dayStats.today.count,
        calendarDate: dayStats.today.calendarDate,
        label: dayStats.today.label,
      },
      yesterday: {
        count: dayStats.yesterday.count,
        calendarDate: dayStats.yesterday.calendarDate,
        label: dayStats.yesterday.label,
      },
    });
  } catch (err) {
    console.error("[chatbot-chat-stats]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load chatbot stats" },
      { status: 500 },
    );
  }
}
