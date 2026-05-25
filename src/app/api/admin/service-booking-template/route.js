// src/app/api/admin/send-invoice-whatsapp/route.js
// ✅ Is file ko poora replace kar do
// ✅ Ye aapke working service-booking-template API ke same format me hai

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;


// Normalize Indian number
function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  // Remove leading 0
  if (n.startsWith("0")) {
    n = n.slice(1);
  }

  // Add India country code
  if (n.length === 10) {
    n = "91" + n;
  }

  // Validate final number
  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
}

export async function POST(req) {
  try {
    await connectDB();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 1. Revenue Record Fetch
    // =====================================================
    const revenue = await FranchiseRevenue.findById(userId).lean();

    if (!revenue) {
      return NextResponse.json(
        {
          success: false,
          message: "Revenue record not found",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 2. User Details Fetch
    // =====================================================
    const userDetails = await User.findOne({
      userId: revenue.leadId,
    }).lean();

    // =====================================================
    // 3. Mobile Number
    // =====================================================
    const rawPhone =
      userDetails?.phone ||
      revenue.userPhone ||
      revenue.phone ||
      revenue.mobile ||
      revenue.whatsappNumber ||
      "";

    const destination = normalizeNumber(rawPhone);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number",
          rawPhone,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 4. Customer Name
    // =====================================================
    const customerName =
      revenue.leadName ||
      revenue.name ||
      userDetails?.name ||
      userDetails?.fullName ||
      "Customer";

    // =====================================================
    // 5. Public Invoice PDF URL
    // =====================================================
    const origin = new URL(req.url).origin;


    // =====================================================
   // =====================================================
// 5. WhatsApp Payload
// =====================================================

const payload = {
  apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,

  campaignName: "service_booking_request",

  destination: destination,

  userName: "Limbu AI",

  templateParams: [customerName],

  source: "api",

  media: {},

  buttons: [],

  carouselCards: [],

  location: {},

  attributes: {},

  paramsFallbackValue: {
    FirstName: customerName,
  },
};

    console.log("===== INVOICE WHATSAPP PAYLOAD =====");
    console.log(JSON.stringify(payload, null, 2));

    // =====================================================
    // 7. Send to WhatsApp API
    // =====================================================
    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("===== INVOICE WHATSAPP RESPONSE =====");
    console.log(JSON.stringify(data, null, 2));

    // =====================================================
    // 8. Success Check
    // =====================================================
    const isSuccess =
      response.ok &&
      (
        data?.success === true ||
        data?.success === "true" ||
        !!data?.submitted_message_id
      );

    if (isSuccess) {
      return NextResponse.json({
  success: true,
  message: "WhatsApp template sent successfully",
  submitted_message_id:
    data.submitted_message_id || null,
  destination,
  response: data,
});
    }

    // =====================================================
    // 9. API Failure
    // =====================================================
    return NextResponse.json(
  {
    success: false,
    message:
      data?.message ||
      data?.error ||
      "No messages were sent",

    destination,
    response: data,
  },
  { status: 400 }
);
  } catch (error) {
    console.error("SEND INVOICE WHATSAPP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to send invoice",
      },
      { status: 500 }
    );
  }
}