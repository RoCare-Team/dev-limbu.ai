import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

const normalizeNumber = (num) => {
  if (!num) return null;
  let n = num.toString().replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n.length === 12 ? n : null;
};

/** Same template campaign as Tata Dialer WhatsApp. */
const CAMPAIGN_CONFIG = {
  demo_session_confirmation1: {
    mediaUrl:
      "https://limbuai.s3.ap-south-1.amazonaws.com/2WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  },
};

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { adminEmail, users, campaignName } = body;

    if (!adminEmail || typeof adminEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "Admin email required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({
      email: adminEmail.trim(),
    }).select("role email");

    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Users array is required" },
        { status: 400 },
      );
    }

    if (!campaignName || !CAMPAIGN_CONFIG[campaignName]) {
      return NextResponse.json(
        { success: false, message: "Invalid campaign name" },
        { status: 400 },
      );
    }

    let sent = 0;
    const results = [];

    for (const user of users) {
      const destination = normalizeNumber(user.customer_no_with_prefix);

      if (!destination) {
        results.push({
          number: user.customer_no_with_prefix,
          status: "Invalid number",
        });
        continue;
      }

      const payload = {
        apiKey: process.env.AISENSY_API_KEY,
        campaignName,
        destination,
        userName: "LimbuAI",
        templateParams: [
          "30 April 2026, 4:00 PM",
          "https://us06web.zoom.us/webinar/register/WN_25C3HlkaSq2GBhwyxvW73w",
          "864 3594 1427",
          "800770",
        ],
        source: "user-management bulk",
        media: {
          url: CAMPAIGN_CONFIG[campaignName].mediaUrl,
          filename: "session_image",
        },
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: user?.name || "User",
        },
      };

      try {
        const response = await fetch(AISENSY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        if (json?.success === "true") {
          sent++;
          results.push({
            number: destination,
            status: "Sent",
            messageId: json.submitted_message_id || null,
          });
        } else {
          results.push({
            number: destination,
            status: "Failed",
            response: json,
          });
        }
      } catch (error) {
        results.push({
          number: destination,
          status: "Error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message processed",
      totalUsers: users.length,
      sent,
      failed: users.length - sent,
      details: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
