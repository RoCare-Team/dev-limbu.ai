import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import User from "@/models/User";
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
    const phones = [
      ...new Set(
        [...dayStats.today.users, ...dayStats.yesterday.users]
          .map((u) => u.phone)
          .filter(Boolean),
      ),
    ];

    const appUsers = phones.length
      ? await User.find({ phone: { $in: phones } })
          .select(
            "userId fullName email phone chatbotUserId source assignedAgentId",
          )
          .lean()
      : [];

    const byPhone = new Map(appUsers.map((u) => [u.phone, u]));

    const enrich = (rows) =>
      rows.map((row) => {
        const app = byPhone.get(row.phone) || null;
        return {
          ...row,
          registered: !!app,
          appUserId: app?.userId || null,
          fullName: app?.fullName || null,
          email: app?.email || null,
          source: app?.source || null,
        };
      });

    return NextResponse.json({
      success: true,
      timeZone: dayStats.timeZone,
      today: { ...dayStats.today, users: enrich(dayStats.today.users) },
      yesterday: {
        ...dayStats.yesterday,
        users: enrich(dayStats.yesterday.users),
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
