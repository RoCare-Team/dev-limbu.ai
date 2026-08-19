import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const normalizeNumber = (num) => {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  // Strip country code 91 if number is too long (e.g., "9109899144738" = 13 digits)
  if (n.startsWith("91") && n.length > 12) {
    n = n.slice(2);
  }

  // Remove leading 0 (e.g., "09899144738" → "9899144738")
  if (n.startsWith("0")) n = n.slice(1);

  // Add country code if 10 digits
  if (n.length === 10) n = `91${n}`;

  return n.length === 12 ? n : null;
};

/** Webinar join link — env se override kar sakte hain. */
const WEBINAR_JOIN_LINK =
  process.env.WEBINAR_JOIN_LINK ||
  "https://us06web.zoom.us/j/85769394728?pwd=rLLbOCayy4hh7dRJhjb7aHRRSb2nXD.1";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Admin datetime-local input ("2026-08-20T16:00") ko padhne laayak
 * label me badalta hai → "20 Aug 2026, 04:00 PM".
 * String ko as-is IST wall-clock maana jaata hai (koi timezone shift nahi).
 */
const formatWebinarDateTime = (value) => {
  const m = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
  );
  if (!m) return String(value || "").trim();

  const [, year, month, day, hourStr, minute] = m;
  const hour24 = parseInt(hourStr, 10);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${day} ${MONTHS[parseInt(month, 10) - 1]} ${year}, ${String(
    hour12,
  ).padStart(2, "0")}:${minute} ${suffix}`;
};

const CAMPAIGN_CONFIG = {

  google_business_profile_management: {
    campaignName: "new_gmb_01",
    source: "user-management google-business",
  },

  magic_qr_code: {
    campaignName: "magic qr code",
    source: "user-management magic-qr",
  },
  gmb_health: {
    campaignName: "gmb_health",
    source: "user-management gmb-health",
  },
  free_website_build: {
    campaignName: "free_website_build",
    source: "user-management free-website",
  },
  keyword_insights: {
    campaignName: "keyword_insights",
    source: "user-management keyword-insights",
  },
  gmb_insights: {
    campaignName: "gmb_insights",
    source: "user-management gmb-insights",
  },
  review_reply_automation_new: {
    campaignName: "review_reply_automation_new",
    source: "user-management review-reply",
  },

  /**
   * Webinar invite — 3 params:
   *   {{1}} customer name
   *   {{2}} webinar date & time (admin har send se pehle choose karta hai)
   *   {{3}} webinar join link
   */
  webinar_invite: {
    campaignName: "limbu_webinar_new",
    source: "user-management webinar",
    requiresWebinarDateTime: true,
    buildParams: ({ firstName, webinarDateTime }) => ({
      templateParams: [
        firstName,
        formatWebinarDateTime(webinarDateTime),
        WEBINAR_JOIN_LINK,
      ],
      paramsFallbackValue: {
        FirstName: firstName,
      },
    }),
  },
};

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { adminEmail, users, templateId, webinarDateTime } = body;

    if (!adminEmail || typeof adminEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "Admin email required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({ email: adminEmail.trim() }).select(
      "role email",
    );

    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const config = CAMPAIGN_CONFIG[templateId];

    if (!config) {
      return NextResponse.json(
        { success: false, message: `Unknown templateId: ${templateId}` },
        { status: 400 },
      );
    }

    // Webinar template bina date & time ke send nahi hona chahiye.
    if (config.requiresWebinarDateTime && !String(webinarDateTime || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Webinar date & time is required" },
        { status: 400 },
      );
    }

if (templateId === "google_business_profile_management") {
 
  console.log("👥 Total Users:", users?.length || 0);
}

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Users array is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIMBU_AI_WHATSAPP_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "WhatsApp API key not configured" },
        { status: 500 },
      );
    }

    let sent = 0;
    const results = [];

    for (const user of users) {
      const destination = normalizeNumber(
        user.customer_no_with_prefix || user.phone || user.mobileNumber,
      );

      const firstName = user.name || user.fullName || "User";

      if (!destination) {
        results.push({
          userId: user.userId || null,
          number:
            user.customer_no_with_prefix ||
            user.phone ||
            user.mobileNumber,
          status: "Invalid number",
        });
        continue;
      }

      // Default (purane templates): sirf {{1}} = customer name.
      // Jis template ko zyada params chahiye wo buildParams deta hai.
      const { templateParams, paramsFallbackValue } = config.buildParams
        ? config.buildParams({ firstName, webinarDateTime, user })
        : {
            templateParams: ["$FirstName"],
            paramsFallbackValue: { FirstName: firstName },
          };

      const payload = {
        apiKey,
        campaignName: config.campaignName,
        destination,
        userName: "Limbu AI",
        templateParams,
        source: "api",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue,
      };

      try {
        const response = await fetch(AISENSY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        const ok =
          response.ok &&
          (json?.success === true || json?.success === "true");

        if (ok) {
          sent++;
          results.push({
            userId: user.userId || null,
            number: destination,
            status: "Sent",
            messageId: json.submitted_message_id || null,
          });
        } else {
          results.push({
            userId: user.userId || null,
            number: destination,
            status: "Failed",
            response: json,
          });
        }
      } catch (error) {
        results.push({
          userId: user.userId || null,
          number: destination,
          status: "Error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: sent > 0,
      message: sent > 0 ? "Message processed" : "No messages were sent",
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
