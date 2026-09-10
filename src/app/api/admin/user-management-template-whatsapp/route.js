import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import {
  WEBINAR_JOIN_LINK,
  formatWebinarDateTime,
} from "@/lib/webinarInvite";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/**
 * Batch endpoint — campaign ka naam URL me jaata hai aur ek hi request me
 * saare numbers `messages[]` array ke through bhejte hain.
 */
const aisensyBatchUrl = (campaignName) =>
  `https://whatsapp.limbu.ai/api/campaigns/${encodeURIComponent(
    campaignName,
  )}/send`;

/**
 * Business Growth Workshop template ka video header — env se override ho sakta hai.
 *
 * Note: WhatsApp ke liye video H.264 Baseline + faststart (moov atom aage) honi
 * chahiye, warna "something is wrong with the video file" aata hai. Naya video
 * lagane se pehle:
 *   ffmpeg -i in.mp4 -vf scale=720:1280 -c:v libx264 -profile:v baseline \
 *     -level 3.1 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 \
 *     -movflags +faststart out.mp4
 */
const BUSINESS_WORKSHOP_VIDEO_URL =
  process.env.BUSINESS_WORKSHOP_VIDEO_URL ||
  "https://limbuai.s3.ap-south-1.amazonaws.com/workshop-whatsapp.mp4";

/** "Ramesh Kumar Sharma" → { firstName: "Ramesh", lastName: "Kumar Sharma" } */
const splitName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "User", lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

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
   * Hindi subscription reminder — 2 params:
   *   {{1}} user ka naam
   *   {{2}} webinar registration link
   * Ye campaign batch endpoint use karta hai (ek request, saare numbers).
   */
  subscription_reminder_hindi: {
    campaignName: "new_reminder_sub_hindi",
    source: "user-management subscription-reminder-hindi",
    batch: true,
    buildParams: ({ firstName }) => ({
      // Batch endpoint par "$FirstName" placeholder resolve nahi hota (message
      // me literal "$FirstName" chala jaata tha), isliye asli naam bhejte hain.
      templateParams: [firstName, WEBINAR_JOIN_LINK],
      paramsFallbackValue: { FirstName: firstName },
    }),
  },

  /**
   * Business Growth Workshop — video header + 1 param:
   *   {{1}} webinar join link
   * Batch endpoint se jaata hai (ek request, saare numbers).
   *
   * Campaign ab `business_growth_workshop_limbu_sub__new` hai (template:
   * copy_of_business_growth_workshop). Purana `business_growth_workshop_camp`
   * template me link ka VARIABLE hi nahi tha, isliye hum jo join link bhejte the
   * wo message me kabhi dikhta hi nahi tha — user ko sirf static text milta tha.
   * Naye template me {{1}} link ke liye hai.
   *
   * Video jaan-boojhkar wahi purani hai (BUSINESS_WORKSHOP_VIDEO_URL) — sirf
   * campaign badla hai, creative nahi. `media` optional override hai; ise bhejte
   * rahenge taaki video hamesha hamare control me rahe, campaign ki apni default
   * setting par depend na kare.
   */
  business_growth_workshop: {
    campaignName:
      process.env.BUSINESS_WORKSHOP_CAMPAIGN ||
      "business_growth_workshop_limbu_sub__new",
    source: "user-management business-growth-workshop",
    batch: true,
    buildParams: () => ({
      templateParams: [WEBINAR_JOIN_LINK],
      media: {
        url: BUSINESS_WORKSHOP_VIDEO_URL,
        filename: "business-growth-workshop.mp4",
      },
    }),
  },

  /**
   * Webinar invite — 3 params:
   *   {{1}} customer name
   *   {{2}} webinar date & time (admin har send se pehle choose karta hai)
   *   {{3}} webinar join link
   *
   * Webinar ID aur passcode template ke body me static text hain (params nahi),
   * isliye yahan sirf 3 hi params jaate hain.
   *
   * Ye campaign batch endpoint use karta hai — ek request me saare numbers.
   */
  webinar_invite: {
    campaignName: "limbu_webinar_new",
    source: "user-management webinar",
    requiresWebinarDateTime: true,
    batch: true,
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

    /* ----------------------------
       BATCH CAMPAIGNS — ek hi request me saare numbers
    ---------------------------- */
    if (config.batch) {
      const messages = [];

      for (const user of users) {
        const destination = normalizeNumber(
          user.customer_no_with_prefix || user.phone || user.mobileNumber,
        );

        if (!destination) {
          results.push({
            userId: user.userId || null,
            number:
              user.customer_no_with_prefix || user.phone || user.mobileNumber,
            status: "Invalid number",
          });
          continue;
        }

        const { firstName } = splitName(user.name || user.fullName || "User");

        // Batch endpoint "$FirstName" jaise placeholders resolve nahi karta,
        // isliye yahan hamesha asli value bhejte hain.
        const built = config.buildParams
          ? config.buildParams({ firstName, webinarDateTime, user })
          : {
              templateParams: [firstName],
              paramsFallbackValue: { FirstName: firstName },
            };

        const message = {
          destination,
          templateParams: built.templateParams || [],
        };

        // Optional — sirf tab bhejte hain jab template me hain, warna API ko
        // khaali objects bhejne ki zarurat nahi.
        if (built.paramsFallbackValue) {
          message.paramsFallbackValue = built.paramsFallbackValue;
        }
        if (built.media) {
          message.media = built.media;
        }

        messages.push(message);
      }

      if (!messages.length) {
        return NextResponse.json(
          { success: false, message: "No valid phone numbers", sent: 0, results },
          { status: 400 },
        );
      }

      try {
        const response = await fetch(aisensyBatchUrl(config.campaignName), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, messages }),
        });

        const json = await response.json().catch(() => ({}));
        const ok = response.ok && json?.success !== false;

        if (!ok) {
          console.error("Batch campaign failed:", config.campaignName, json);
          // Provider ka asli error surface karo. Sabse aam failure yahan
          // "template params ki ginti match nahi hui" hoti hai (template me 2
          // variable, humne 1 bheja — ya ulta). Sirf "Campaign send failed"
          // dikhane se admin ko pata hi nahi chalta ki kya theek karna hai.
          const providerError =
            json?.message ||
            json?.error?.message ||
            json?.error ||
            (Array.isArray(json?.errors) && json.errors[0]?.message) ||
            "";
          return NextResponse.json(
            {
              success: false,
              message: providerError
                ? `${config.campaignName}: ${providerError}`
                : `Campaign "${config.campaignName}" send failed (HTTP ${response.status})`,
              campaignName: config.campaignName,
              // Ek sample message — param count/order debug karne ke liye.
              sampleMessage: messages[0],
              providerResponse: json,
              sent: 0,
              results,
            },
            { status: 502 },
          );
        }

        sent = messages.length;
        messages.forEach((m) =>
          results.push({ number: m.destination, status: "Sent" }),
        );

        return NextResponse.json({
          success: true,
          message: `Campaign sent to ${sent} number${sent === 1 ? "" : "s"}`,
          sent,
          results,
        });
      } catch (error) {
        console.error("Batch campaign error:", error);
        return NextResponse.json(
          { success: false, message: "Could not reach WhatsApp service", sent: 0 },
          { status: 502 },
        );
      }
    }

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
