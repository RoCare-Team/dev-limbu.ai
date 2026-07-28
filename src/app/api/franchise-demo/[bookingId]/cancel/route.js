import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";
import { deleteDemoMeetEvent } from "@/utils/googleMeet";

// PATCH /api/franchise-demo/[bookingId]/cancel
// "Booked" -> "Cancelled" (slot free ho jaata hai)
export async function PATCH(req, { params }) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await FranchiseDemoBooking.findOne({ bookingId });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "Booked") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot cancel a booking with status "${booking.status}"`,
        },
        { status: 409 }
      );
    }

    // Google Calendar event bhi hata do (agar auto-generated tha) — best-effort
    if (booking.calendarEventId) {
      await deleteDemoMeetEvent(booking.calendarEventId);
    }

    booking.status = "Cancelled";
    await booking.save();

    return NextResponse.json(
      { success: true, booking: booking.toObject() },
      { status: 200 }
    );
  } catch (err) {
    console.error("[franchise-demo/cancel]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
