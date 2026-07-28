import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/* AiSensy / Limbu WhatsApp API key (hardcoded per request). */
const AISENSY_API_KEY =
  "ws_fca30eb07595f51089b57a862ecac20c12947558b56f1a70";

/* Single approved template used for ALL remark actions. */
const FOLLOW_UP_CAMPAIGN = "franchiese_follow_up_temp";

/* Support number shown as {{3}} in the template. */
const SUPPORT_PHONE = "9289344708";

/* ================= PREDEFINED STATUS MESSAGES ({{2}}) ================= */
/* One friendly status line per remark — this is the only thing that changes
   between actions; every remark uses the same template. */
const REMARK_STATUS_MESSAGE = {
  call_not_picked:
    "We tried calling you but couldn't connect. Our team will reach out to you again shortly.",
  callback_later:
    "As requested, our team will call you back soon regarding your franchise enquiry.",
  call_back:
    "As requested, our team will call you back soon regarding your franchise enquiry.",
  interested:
    "Thank you for your interest! Our team will connect with you shortly with the next steps.",
  not_interested:
    "We've noted your response. If you change your mind, we're always here to help.",
  wrong_number:
    "It looks like we reached an incorrect number. Please share your correct contact details.",
  switch_off:
    "We tried calling but your number was unreachable. We'll try connecting with you again soon.",
  meeting_scheduled_online:
    "Your meeting has been scheduled. Our team will share the details with you shortly.",
  meeting_scheduled_offline:
    "Your meeting has been scheduled. Our team will share the details with you shortly.",
  followup_reminder:
    "This is a gentle reminder regarding your franchise enquiry follow-up.",
};

/* ================= MOBILE NORMALIZER ================= */

const normalizeIndianNumber = (num) => {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  // 10 digit → add 91
  if (n.length === 10) return "91" + n;

  // 91XXXXXXXXXX
  if (n.length === 12 && n.startsWith("91")) return n;

  return null;
};

/* ================= API HANDLER ================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const { remark, destination, userName } = body;

    /* ===== BASIC VALIDATION ===== */

    if (!remark) {
      return NextResponse.json(
        { success: false, message: "remark is required" },
        { status: 400 }
      );
    }

    // Every remark action now uses the SAME approved follow-up template.
    // The only thing that changes per action is the predefined status line.
    const statusMessage = REMARK_STATUS_MESSAGE[remark];

    if (!statusMessage) {
      return NextResponse.json(
        { success: false, message: "Invalid remark type" },
        { status: 400 }
      );
    }

    if (!destination || !userName) {
      return NextResponse.json(
        { success: false, message: "destination and userName required" },
        { status: 400 }
      );
    }

    /* ===== NUMBER NORMALIZATION ===== */

    const formattedNumber = normalizeIndianNumber(destination);

    if (!formattedNumber) {
      return NextResponse.json(
        { success: false, message: "Invalid Indian mobile number" },
        { status: 400 }
      );
    }

    /* ===== SAFE USERNAME (AiSensy Rule) ===== */

    const safeUserName =
      userName.replace(/[^a-zA-Z0-9]/g, "") || "User";

    // {{3}} = a number the customer can contact. Prefer the executive's mobile
    // when available, otherwise fall back to the brand support number.
    const contactNumber =
      normalizeIndianNumber(body.executiveMobile) || SUPPORT_PHONE;

    /* ===== PAYLOAD BUILD ===== */
    /* Template params: {{1}} name, {{2}} status message, {{3}} contact number */

    const payload = {
      apiKey: AISENSY_API_KEY,
      campaignName: FOLLOW_UP_CAMPAIGN,
      destination: formattedNumber,
      userName: safeUserName,
      templateParams: [
        body.userName || "Customer",
        statusMessage,
        contactNumber,
      ],
      source: "new-landing-page form",

      // Optional but safe defaults
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
    };

    /* ===== API CALL ===== */

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "AiSensy API Error",
          aiSensyResponse: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      triggeredCampaign: FOLLOW_UP_CAMPAIGN,
      aiSensyResponse: data,
    });
  } catch (error) {
    console.error("AiSensy Error:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
