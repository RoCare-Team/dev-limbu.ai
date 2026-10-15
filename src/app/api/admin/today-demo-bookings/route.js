import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { getTodayDemoBookingsForAgent } from "@/lib/demoBookings";

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

    const result = await getTodayDemoBookingsForAgent(adminEmail);
    return NextResponse.json({
      ...result,
      source: "demoBookingDB",
    });
  } catch (err) {
    console.error("[today-demo-bookings]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load today's demos" },
      { status: 500 },
    );
  }
}
