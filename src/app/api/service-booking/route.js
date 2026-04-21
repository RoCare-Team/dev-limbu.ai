import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ServiceBooking from "@/models/ServiceBooking";
import { logApiRequest } from "@/lib/apiLogger";
import { applyCheckoutToUser } from "@/lib/checkoutApplyUserPlan";

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

    if (body.status === "paid" && body.paymentId) {
      const applied = await applyCheckoutToUser({
        name: body.name,
        phone: body.phone,
        email: body.email,
        gstNumber: body.gstNumber,
        planTitle: body.planTitle,
        planType: body.planType,
        planDuration: body.planDuration,
        planKey: body.planKey,
        paymentId: body.paymentId,
        orderId: body.orderId,
        razorpay_signature: body.razorpay_signature,
        totalAmount: body.totalAmount,
      });
      if (!applied.ok) {
        const res = NextResponse.json(
          { success: false, error: applied.error },
          { status: applied.status }
        );
        await logApiRequest({
          path: "/api/service-booking",
          method: "POST",
          status: applied.status,
          durationMs: Date.now() - startedAt,
          errorMessage: applied.error,
        });
        return res;
      }
      body.userId = applied.user.userId;
    }

    const booking = await ServiceBooking.create(body);

    const res = NextResponse.json(
      {
        success: true,
        data: booking,
        ...(body.userId && { checkoutUserId: body.userId }),
      },
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
