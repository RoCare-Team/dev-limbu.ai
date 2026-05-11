

// Create new file:
// src/app/api/contact-leads/send-enquiry-template/route.js

import { NextResponse } from "next/server";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJlbWFpbCI6InJvYmhpbmtoYW5AZ21haWwuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJ3b3Jrc3BhY2VJZCI6MSwiaWF0IjoxNzc4MzA3MjgyLCJleHAiOjE3Nzg5MTIwODJ9.Vd5_GYgOPwZjMKxgelN-fUMWgar2srFogqur4eKFgP0";

function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;

  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
}



export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, firstName } = body;

    console.log("Raw phone received:", phone);

    const destination = normalizeNumber(phone);

    console.log("Normalized destination:", destination);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number",
          receivedPhone: phone,
        },
        { status: 400 }
      );
    }

    const payload = {
      apiKey: API_KEY,
      campaignName: "enquiry_details",
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
        FirstName: firstName || "firstname",
      },
    };

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // 👇 IMPORTANT FIX
    const responseText = await response.text();

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {
        success: false,
        message: responseText || "Invalid response from WhatsApp API",
      };
    }

    console.log("WhatsApp API Response:", data);

    return NextResponse.json(
      {
        success:
          response.ok &&
          (data?.success === true ||
            data?.success === "true" ||
            data?.submitted_message_id),

        message:
          data?.message ||
          data?.msg ||
          (response.ok
            ? "Message sent successfully"
            : "Failed to send message"),

        submitted_message_id:
          data?.submitted_message_id || null,

        rawResponse: data,
      },
      {
        status: response.ok ? 200 : response.status,
      }
    );
  } catch (error) {
    console.error("WhatsApp API Error:", error);

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