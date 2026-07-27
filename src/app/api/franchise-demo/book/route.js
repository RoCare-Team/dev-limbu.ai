import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";
import FranchiseDemoAgent from "@/models/FranchiseDemoAgent";
import { isValidDate, isValidSlotTime } from "@/utils/franchiseDemoSlots";
import { sendDemoWhatsapp } from "@/utils/sendDemoWhatsapp";
import { createDemoMeetEvent } from "@/utils/googleMeet";

// POST /api/franchise-demo/book
// Body: { leadId?, date, slotTime, clientName, clientPhone, clientEmail? }
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      leadId = "",
      date,
      slotTime,
      clientName,
      clientPhone,
      clientEmail = "",
    } = body;

    // 1. Validate (leadId optional)
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
    if (!clientName || !String(clientName).trim()) {
      return NextResponse.json(
        { success: false, message: "clientName is required" },
        { status: 400 }
      );
    }
    if (!clientPhone || !String(clientPhone).trim()) {
      return NextResponse.json(
        { success: false, message: "clientPhone is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 2. Active agents (DB se)
    const activeAgents = await FranchiseDemoAgent.find({ isActive: true }).lean();
    if (!activeAgents.length) {
      return NextResponse.json(
        { success: false, message: "No active agents configured" },
        { status: 409 }
      );
    }

    // 3. Already booked agentIds for this date+slot
    const booked = await FranchiseDemoBooking.find({
      date,
      slotTime,
      status: "Booked",
    })
      .select("agentId")
      .lean();
    const bookedAgentIds = new Set(booked.map((b) => b.agentId));

    // 4. Free agents (agent ki pehchaan _id se)
    const freeAgents = activeAgents.filter(
      (a) => !bookedAgentIds.has(String(a._id))
    );

    // 5. Slot full
    if (!freeAgents.length) {
      return NextResponse.json(
        { success: false, message: "Slot full" },
        { status: 409 }
      );
    }

    // 6. Ek-ek free agent try karo — duplicate key (11000) pe next agent
    let booking = null;
    let assignedAgent = null;
    let lastError = null;
    for (const agent of freeAgents) {
      try {
        booking = await FranchiseDemoBooking.create({
          bookingId: `FDB-${Date.now()}`,
          leadId: leadId || "",
          clientName: String(clientName).trim(),
          clientPhone: String(clientPhone).trim(),
          clientEmail: String(clientEmail || "").trim(),
          agentId: String(agent._id), // identity = DB _id
          agentName: agent.agentName,
          agentPhone: agent.agentPhone,
          date,
          slotTime,
          meetLink: agent.meetLink || "", // 7. fallback meetLink (auto Meet baad me)
          status: "Booked",
        });
        assignedAgent = agent;
        break; // success
      } catch (err) {
        lastError = err;
        if (err?.code === 11000) {
          // race condition — koi aur request ne is agent+slot ko book kar liya, next try
          continue;
        }
        throw err; // koi aur error — bubble up
      }
    }

    if (!booking) {
      // saare free agents race me chhin gaye
      return NextResponse.json(
        {
          success: false,
          message: "Slot full",
          detail: lastError?.message || "All free agents got booked concurrently",
        },
        { status: 409 }
      );
    }

    // 7b. Unique Google Meet link auto-generate karo (fail ho to agent ka fixed link fallback)
    try {
      const meet = await createDemoMeetEvent({
        bookingId: booking.bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        agentName: booking.agentName,
        agentEmail: assignedAgent?.agentEmail || "",
        date: booking.date,
        slotTime: booking.slotTime,
      });
      if (meet?.meetLink) {
        booking.meetLink = meet.meetLink;
        booking.calendarEventId = meet.eventId || "";
        // whatsapp real link bheje isliye pehle save
        await booking.save();
      }
    } catch (err) {
      console.error("[franchise-demo/book] meet generation failed:", err.message);
      // fallback: agent config ka fixed meetLink hi rahega
    }

    // 8. WhatsApp — client + agent dono ko
    let whatsapp = {
      clientSent: false,
      agentSent: false,
      clientMsgId: "",
      agentMsgId: "",
    };
    try {
      whatsapp = await sendDemoWhatsapp(booking.toObject());
    } catch (err) {
      console.error("[franchise-demo/book] whatsapp failed:", err.message);
    }

    // 9. whatsapp field save
    booking.whatsapp = whatsapp;
    await booking.save();

    // 10. Response
    return NextResponse.json(
      { success: true, booking: booking.toObject() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[franchise-demo/book]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
