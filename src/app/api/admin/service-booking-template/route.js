// src/app/api/admin/send-invoice-whatsapp/route.js
// ✅ Is file ko poora replace kar do
// ✅ Ye aapke working service-booking-template API ke same format me hai

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJlbWFpbCI6InJvYmhpbmtoYW5AZ21haWwuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJ3b3Jrc3BhY2VJZCI6MSwiaWF0IjoxNzc5MDg1Mjk1LCJleHAiOjE3Nzk2OTAwOTV9.LSM5lyvlc3QcSECYS0q6PZ92_DfZWK14sS1KAMuD51Q"

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

    const invoiceUrl =
      `${origin}/api/admin/invoice-tax?id=${userId}`;

    // =====================================================
    // 6. WhatsApp Payload
    // Template: invoice_send
    // Param 1: customer name
    // =====================================================
    const payload = {
      apiKey: API_KEY,
      campaignName: "invoice_send",
      destination: destination,
      userName: "YOUR_BRAND_NAME",

      // Template variable
      templateParams: [customerName],

      source: "api",

      // PDF attachment
      media: {
        url: invoiceUrl,
        filename: `Invoice-${customerName}.pdf`,
      },

      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {},
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
        message: "Invoice sent successfully on WhatsApp",
        submitted_message_id:
          data.submitted_message_id || null,
        invoiceUrl,
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
        invoiceUrl,
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