

// Create new file:
// src/app/api/admin/package-booking-template/route.js

import { NextResponse } from "next/server";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

// Working API Key
const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;
  

// Normalize Indian mobile number
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

  // Final validation
  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
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
      campaignName: "package_booking_request",
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

    // Send to WhatsApp API
    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

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

    // API failed
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
    console.error("Package Booking WhatsApp Error:", error);

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