// Create new file:
// src/app/api/admin/service-booking-template/route.js

import { NextResponse } from "next/server";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

// Working API key
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJlbWFpbCI6InJvYmhpbmtoYW5AZ21haWwuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJ3b3Jrc3BhY2VJZCI6MSwiaWF0IjoxNzc5MDg1Mjk1LCJleHAiOjE3Nzk2OTAwOTV9.LSM5lyvlc3QcSECYS0q6PZ92_DfZWK14sS1KAMuD51Q";
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

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Service Booking WhatsApp API is working",
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, firstName } = body;

    // Validate phone number
    const destination = normalizeNumber(phone);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number",
        },
        { status: 400 }
      );
    }

    // Exact WhatsApp payload
    const payload = {
      apiKey: API_KEY,
      campaignName: "service_booking_request",
      destination: destination,
      userName: "YOUR_BRAND_NAME",
      templateParams: ["$FirstName"],
      source: "api",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: firstName || "Customer",
      },
    };

    console.log("===== SERVICE BOOKING WHATSAPP PAYLOAD =====");
    console.log(JSON.stringify(payload, null, 2));

    // Send to WhatsApp API
    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("===== SERVICE BOOKING WHATSAPP RESPONSE =====");
    console.log(JSON.stringify(data, null, 2));

    // Success check
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
        message: "Template sent successfully",
        submitted_message_id:
          data.submitted_message_id || null,
        response: data,
      });
    }

    // API returned failure
    return NextResponse.json(
      {
        success: false,
        message:
          data?.message ||
          data?.error ||
          "No messages were sent",
        response: data,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Service Booking WhatsApp Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to send template",
      },
      { status: 500 }
    );
  }
}