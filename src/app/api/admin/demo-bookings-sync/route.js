import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { syncPendingDemoBookings } from "@/lib/demoBookings";

export const dynamic = "force-dynamic";

export async function POST(req) {
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
    if (!admin || !["superAdmin", "seniorManager", "admin"].includes(admin.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const results = await syncPendingDemoBookings();
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[demo-bookings-sync]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 },
    );
  }
}
