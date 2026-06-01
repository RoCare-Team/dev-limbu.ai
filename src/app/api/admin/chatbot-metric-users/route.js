import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { getChatbotMetricUsers } from "@/lib/limbuBotUserSync";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");
    const metricId = (searchParams.get("metricId") || "").trim();
    const period = (searchParams.get("period") || "total").trim();
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit")) || 70);

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

    const result = await getChatbotMetricUsers({
      metricId,
      period,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[chatbot-metric-users]", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load chatbot metric users",
      },
      { status: 500 },
    );
  }
}
