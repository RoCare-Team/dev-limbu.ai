import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const normalizeNumber = (num) => {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  return n.length === 12 ? n : null;
};

const CAMPAIGN_CONFIG = {

  google_business_profile_management: {
  campaignName: "gmb_profile_new",
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
};

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { adminEmail, users, templateId } = body;

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

if (templateId === "google_business_profile_management") {
  console.log("========== GOOGLE BUSINESS TEMPLATE DEBUG ==========");
  console.log("📌 templateId:", templateId);
  console.log("🧩 Config:", config);
  console.log("👥 Total Users:", users?.length || 0);
}

if (!config) {
  return NextResponse.json(
    { success: false, message: "Invalid WhatsApp template" },
    { status: 400 }
  );
}

if (!Array.isArray(users) || users.length === 0) {
  return NextResponse.json(
    { success: false, message: "Users array is required" },
    { status: 400 }
  );
}

let sent = 0;
const results = [];
const HARDCODED_API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;

for (const user of users) {
  const destination = normalizeNumber(
    user.customer_no_with_prefix || user.phone || user.mobileNumber
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

  const payload = {
    apiKey: HARDCODED_API_KEY,
    campaignName: config.campaignName,
    destination,
    userName: "Limbu AI",
    templateParams: ["$FirstName"],
    source: "api",
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName,
    },
  };

  if (templateId === "google_business_profile_management") {
    console.log("📤 GOOGLE BUSINESS PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));
  }

  try {
    // fetch code here
  } catch (error) {
    // error handling here
  }


      try {
        const response = await fetch(AISENSY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

       if (templateId === "google_business_profile_management") {
  console.log("📥 GOOGLE BUSINESS RESPONSE STATUS:", response.status);
  console.log("📥 GOOGLE BUSINESS RESPONSE:");
  console.log(JSON.stringify(json, null, 2));
  console.log("===============================================");
}

        const ok = response.ok && (json?.success === true || json?.success === "true");

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
