import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

// -------------------------
// DB CONNECT
// -------------------------
async function dbConnect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
    dbName: "demoBookingDB",
  });
}

// -------------------------
// SCHEMA + MODEL
// -------------------------
const DemoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    seminarTime: { type: String, required: true },
    selectedDate: { type: String, required: true },
    status: { type: String, default: "Not Attended" },
  },
  { timestamps: true, collection: "demoBookings" }
);


const DemoBooking =
  mongoose.models.demoBookings ||
  mongoose.model("demoBookings", DemoSchema);

// -------------------------
// POST → CREATE BOOKING
// -------------------------
export async function POST(request) {
  try {
    await dbConnect();
    const { name, phone, seminarTime, selectedDate, status } = await request.json();

    if (!name || !phone || !seminarTime || !selectedDate) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const saved = await DemoBooking.create({
      name,
      phone,
      seminarTime,
      selectedDate,
      status: status || "Not Attended",
    });

    return NextResponse.json({
      success: true,
      message: "Demo booked successfully!",
      data: {
        id: saved._id,
        name: saved.name,
        phone: saved.phone,
        seminarTime: saved.seminarTime,
        selectedDate: saved.selectedDate,
        status: saved.status,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// -------------------------
// GET → FETCH ALL BOOKINGS
// -------------------------
export async function GET() {
  try {
    await dbConnect();
    const allBookings = await DemoBooking.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: allBookings.length,
      data: allBookings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}



// -------------------------
// DELETE → REMOVE BOOKING
// -------------------------
export async function DELETE(request) {
  try {
    await dbConnect();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required." },
        { status: 400 }
      );
    }

    const deleted = await DemoBooking.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully!",
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// -------------------------
// PUT → UPDATE STATUS
// -------------------------
export async function PUT(request) {
  try {
    await dbConnect();
    const { id, status } = await request.json();

    const updated = await DemoBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Status Updated!",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
