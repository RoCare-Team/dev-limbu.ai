import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";

// GET /api/franchise-demo/bookings?date=&agentId=&status=
// Admin listing with optional filters.
export async function GET(req) {
  try {
    const sp = req.nextUrl.searchParams;
    const date = sp.get("date");
    const agentId = sp.get("agentId");
    const status = sp.get("status");

    const query = {};
    if (date) query.date = date;
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    await dbConnect();

    const bookings = await FranchiseDemoBooking.find(query)
      .sort({ date: 1, slotTime: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: bookings.length,
        filters: { date: date || null, agentId: agentId || null, status: status || null },
        bookings,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[franchise-demo/bookings]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
