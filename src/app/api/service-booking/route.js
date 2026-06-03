import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import ServiceBooking from "@/models/ServiceBooking";
import { logApiRequest } from "@/lib/apiLogger";
import { normalizeBookingSource } from "@/lib/bookingSource";
import { savePaymentByPhone, normalizePhone } from "@/lib/gmbSessionStore";
import { applyCheckoutToUser } from "@/lib/checkoutApplyUserPlan";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

function getAdminJwtPayload(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role) return decoded;
  } catch {
    return null;
  }
  return null;
}

// ✅ CREATE SERVICE BOOKING
export async function POST(req) {
  const startedAt = Date.now();
  try {
    await dbConnect();

    const body = await req.json();
    const bookingSource = normalizeBookingSource(body.bookingSource);
    body.bookingSource = bookingSource;

    // Phone is the primary chatbot identifier
    const chatbotPhone = normalizePhone(body.chatbotPhone || body.phone || "");

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: "Request body is empty" },
        { status: 400 },
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
        bookingSource,
      });
      if (!applied.ok) {
        const res = NextResponse.json(
          { success: false, error: applied.error },
          { status: applied.status },
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

    if (
      chatbotPhone &&
      body.status === "paid" &&
      body.paymentId &&
      body.userId
    ) {
      try {
        await savePaymentByPhone(chatbotPhone, {
          paymentId: body.paymentId,
          orderId: body.orderId,
          totalAmount: body.totalAmount,
          planTitle: body.planTitle,
          userId: body.userId,
          email: body.email,
        });
      } catch (gmbErr) {
        console.error("savePaymentByPhone:", gmbErr);
      }
    }

    const booking = await ServiceBooking.create(body);

    const res = NextResponse.json(
      {
        success: true,
        data: booking,
        ...(body.userId && { checkoutUserId: body.userId }),
      },
      { status: 201 },
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
      { status: 500 },
    );
  }
}

/** Admin: correct booking channel (website / chatbot / manual-upload). */
export async function PATCH(req) {
  const startedAt = Date.now();
  try {
    if (!getAdminJwtPayload(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await req.json();
    const { bookingId, bookingSource: rawSource } = body;
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId required" },
        { status: 400 },
      );
    }
    const bookingSource = normalizeBookingSource(rawSource);
    const updated = await ServiceBooking.findByIdAndUpdate(
      bookingId,
      { $set: { bookingSource } },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }
    const res = NextResponse.json({ success: true, data: updated });
    await logApiRequest({
      path: "/api/service-booking",
      method: "PATCH",
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return res;
  } catch (error) {
    console.error("PATCH service-booking:", error);
    await logApiRequest({
      path: "/api/service-booking",
      method: "PATCH",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message,
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
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

    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // ── Franchise filter ──────────────────────────────────────────────
    const franchiseId = searchParams.get("frienchieseid");
    if (franchiseId) {
      const User = (await import("@/models/User")).default;
      const franchiseUsers = await User.find(
        { franchiseId: franchiseId },
        { userId: 1, _id: 0 },
      ).lean();
      const userIds = franchiseUsers.map((u) => u.userId).filter(Boolean);
      query.userId = { $in: userIds };
    }
    // ─────────────────────────────────────────────────────────────────

    const bookings = await ServiceBooking.find(query).sort({ createdAt: -1 }); // latest first

    const res = NextResponse.json(
      { success: true, data: bookings },
      { status: 200 },
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
      { status: 500 },
    );
  }
}
