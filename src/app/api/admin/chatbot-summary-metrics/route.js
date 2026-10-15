import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { getChatbotDashboardMetrics } from "@/lib/limbuBotUserSync";
import {
  getDemoBookingMetrics,
  syncPendingDemoBookings,
} from "@/lib/demoBookings";

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
      !["superAdmin", "seniorManager", "admin", "superfranchiseAdmin", "agent"].includes(
        admin.role,
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const filterByAgent = searchParams.get("filterByAgent");
    const agentScopedEmail =
      admin.role === "agent" ? adminEmail : filterByAgent || null;
    const [metrics, demoMetrics, syncResults] = await Promise.all([
      getChatbotDashboardMetrics({
        filterByAgent: filterByAgent || null,
        role: admin.role,
      }),
      getDemoBookingMetrics({ filterByAgent: agentScopedEmail }),
      syncPendingDemoBookings(),
    ]);

    return NextResponse.json({
      success: true,
      ...metrics,
      totals: {
        ...metrics.totals,
        demoBooked: demoMetrics.totals.demoBooked,
      },
      today: {
        ...metrics.today,
        demoBooked: demoMetrics.today.demoBooked,
      },
      demoSync: syncResults,
    });
  } catch (err) {
    console.error("[chatbot-summary-metrics]", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load chatbot summary metrics",
      },
      { status: 500 },
    );
  }
}
