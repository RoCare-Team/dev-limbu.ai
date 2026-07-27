import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseDemoBooking from "@/models/FranchiseDemoBooking";

const ALLOWED = ["Completed", "NoShow"];

// PATCH /api/franchise-demo/[bookingId]/status
// Body: { status: "Completed" | "NoShow" }
export async function PATCH(req, { params }) {
  try {
    const { bookingId } = await params;
    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId is required" },
        { status: 400 }
      );
    }
    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `status must be one of: ${ALLOWED.join(", ")}`,
        },
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

    if (booking.status === "Cancelled") {
      return NextResponse.json(
        { success: false, message: "Cannot update a cancelled booking" },
        { status: 409 }
      );
    }

    booking.status = status;
    await booking.save();

    return NextResponse.json(
      { success: true, booking: booking.toObject() },
      { status: 200 }
    );
  } catch (err) {
    console.error("[franchise-demo/status]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
