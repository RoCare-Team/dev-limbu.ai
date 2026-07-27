import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";
import FranchiseDemoAgent from "@/models/FranchiseDemoAgent";
import { isValidDate, getAllSlotTimes } from "@/utils/franchiseDemoSlots";

// GET /api/franchise-demo/slots?date=YYYY-MM-DD
// -> poore din ke 10 slots ka status (calendar UI ke liye)
export async function GET(req) {
  try {
    const date = req.nextUrl.searchParams.get("date");

    if (!isValidDate(date)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    await dbConnect();

    const activeAgents = await FranchiseDemoAgent.find({ isActive: true }).lean();
    const totalActiveAgents = activeAgents.length;

    // Us din ki saari "Booked" bookings ek query me nikaal ke slot-wise group karo
    const booked = await FranchiseDemoBooking.find({
      date,
      status: "Booked",
    })
      .select("slotTime agentId")
      .lean();

    const bookedBySlot = new Map(); // slotTime -> Set(agentId)
    for (const b of booked) {
      if (!bookedBySlot.has(b.slotTime)) bookedBySlot.set(b.slotTime, new Set());
      bookedBySlot.get(b.slotTime).add(b.agentId);
    }

    const slots = getAllSlotTimes().map((slotTime) => {
      const bookedAgentIds = bookedBySlot.get(slotTime) || new Set();
      const freeAgentsCount = activeAgents.filter(
        (a) => !bookedAgentIds.has(String(a._id))
      ).length;
      return {
        slotTime,
        isAvailable: freeAgentsCount > 0,
        freeAgentsCount,
        bookedCount: bookedAgentIds.size,
      };
    });

    return NextResponse.json(
      {
        success: true,
        date,
        totalActiveAgents,
        slots,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[franchise-demo/slots]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
