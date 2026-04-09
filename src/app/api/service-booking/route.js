import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ServiceBooking from "@/models/ServiceBooking";
import { logApiRequest } from "@/lib/apiLogger";

// ✅ CREATE SERVICE BOOKING
export async function POST(req) {
  const startedAt = Date.now();
  try {
    await dbConnect();

    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: "Request body is empty" },
        { status: 400 }
      );
    }

    const booking = await ServiceBooking.create(body);

    const res = NextResponse.json(
      { success: true, data: booking },
      { status: 201 }
    );
    await logApiRequest({
      path: "/api/service-booking",
      method: "POST",
      status: 201,
      durationMs: Date.now() - startedAt,
    });
    return res;
  } catch (error) {
    console.error("Service Booking Error:", error);

    await logApiRequest({
      path: "/api/service-booking",
      method: "POST",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Service booking error",
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ GET ALL SERVICE BOOKINGS
export async function GET(req) {
  const startedAt = Date.now();
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const planType = searchParams.get("planType");

    const query = {};
    if (planType) query.planType = planType;

    const bookings = await ServiceBooking
      .find(query)
      .sort({ createdAt: -1 }); // latest first

    const res = NextResponse.json(
      { success: true, data: bookings },
      { status: 200 }
    );
    await logApiRequest({
      path: "/api/service-booking",
      method: "GET",
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return res;
  } catch (error) {
    console.error("Get Service Bookings Error:", error);

    await logApiRequest({
      path: "/api/service-booking",
      method: "GET",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Get service bookings error",
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
