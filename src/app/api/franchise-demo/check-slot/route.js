import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";
import FranchiseDemoAgent from "@/models/FranchiseDemoAgent";
import { isValidDate, isValidSlotTime } from "@/utils/franchiseDemoSlots";

// GET /api/franchise-demo/check-slot?date=YYYY-MM-DD&slotTime=10:00-11:00
// -> { isAvailable, freeAgentsCount }
export async function GET(req) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const slotTime = req.nextUrl.searchParams.get("slotTime");

    if (!isValidDate(date)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    if (!isValidSlotTime(slotTime)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing slotTime" },
        { status: 400 }
      );
    }

    await dbConnect();

    const activeAgents = await FranchiseDemoAgent.find({ isActive: true }).lean();

    const booked = await FranchiseDemoBooking.find({
      date,
      slotTime,
      status: "Booked",
    })
      .select("agentId")
      .lean();

    const bookedAgentIds = new Set(booked.map((b) => b.agentId));
    const freeAgents = activeAgents.filter(
      (a) => !bookedAgentIds.has(String(a._id))
    );

    return NextResponse.json(
      {
        success: true,
        date,
        slotTime,
        isAvailable: freeAgents.length > 0,
        freeAgentsCount: freeAgents.length,
        totalActiveAgents: activeAgents.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[franchise-demo/check-slot]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
