
// src/app/api/admin/demo-session/route.js
// POORA FILE ISSE REPLACE KAR DO

import { NextResponse } from "next/server";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

// Hardcoded API key (same as your working APIs)
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJlbWFpbCI6InJvYmhpbmtoYW5AZ21haWwuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJ3b3Jrc3BhY2VJZCI6MSwiaWF0IjoxNzc4MzA3MjgyLCJleHAiOjE3Nzg5MTIwODJ9.Vd5_GYgOPwZjMKxgelN-fUMWgar2srFogqur4eKFgP0";

// Normalize Indian mobile number
function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;

  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { users = [], campaignName } = body;

    // Validate users
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Users array is required",
          sent: 0,
          failed: 0,
          details: [],
        },
        { status: 400 }
      );
    }

    // Validate campaign
    if (campaignName !== "demo_session_confirmation1") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid campaign name",
          sent: 0,
          failed: users.length,
          details: [],
        },
        { status: 400 }
      );
    }

    let sent = 0;
    const details = [];

    for (const user of users) {
      // Frontend sends:
      // {
      //   customer_no_with_prefix: phone,
      //   name: name
      // }

      const rawPhone =
        user.customer_no_with_prefix ||
        user.phone ||
        user.mobileNumber;

      const destination = normalizeNumber(rawPhone);

      // Invalid number
      if (!destination) {
        details.push({
          number: rawPhone,
          status: "Invalid number",
        });
        continue;
      }

      // EXACT payload format used in your working APIs
      const payload = {
        apiKey: API_KEY,
        campaignName: "demo_session_confirmation1",
        destination: destination,
        userName: "YOUR_BRAND_NAME",

        templateParams: [
          "07 May 2026, 4:00 PM",
          "https://us06web.zoom.us/webinar/register/WN_25C3HlkaSq2GBhwyxvW73w",
          "864 3594 1427",
          "800770",
        ],

        source: "api",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},

        paramsFallbackValue: {
          FirstName: user.name || "User",
        },
      };

      try {
        // Debug logs
        console.log("Sending payload:", payload);

        const response = await fetch(AISENSY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Get raw text first (better for debugging)
        const responseText = await response.text();

        let json = {};
        try {
          json = JSON.parse(responseText);
        } catch {
          json = {
            rawResponse: responseText,
          };
        }

        console.log("AISENSY RESPONSE:", json);

        // Success conditions
        const isSuccess =
          response.ok &&
          (
            json?.success === true ||
            json?.success === "true" ||
            !!json?.submitted_message_id ||
            json?.message === "Campaign submitted successfully"
          );

        if (isSuccess) {
          sent++;

          details.push({
            number: destination,
            status: "Sent",
            messageId: json.submitted_message_id || null,
            response: json,
          });
        } else {
          details.push({
            number: destination,
            status: "Failed",
            response: json,
          });
        }
      } catch (error) {
        details.push({
          number: destination,
          status: "Error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed: users.length - sent,
      details,
      message:
        sent > 0
          ? "Template sent successfully"
          : "No messages were sent",
    });
  } catch (error) {
    console.error("Demo Session API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        sent: 0,
        failed: 0,
        details: [],
      },
      { status: 500 }
    );
  }
}