import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

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

/* ================= CAMPAIGN CONFIG ================= */

const CAMPAIGN_CONFIG = {
  // 🔹 1 PARAM
  call_back: {
    name: "call_back",
    params: (d) => [d.userName],
    required: ["userName"],
  },

  // 🔹 2 PARAMS
  not_interested: {
    name: "not_interested_confirmation",
    params: (d) => [d.userName, d.enquiryId],
    required: ["userName", "enquiryId"],
  },

  wrong_number: {
    name: "wrong_number_update",
    params: (d) => [d.userName, d.enquiryId],
    required: ["userName", "enquiryId"],
  },

  // 🔹 4 PARAMS (Executive Based)
  call_not_picked: {
    name: "call_not_picked_followup",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile,
    ],
    required: ["userName", "enquiryId", "executiveName", "executiveMobile"],
  },

  callback_later: {
    name: "callback_later_after_call",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile,
    ],
    required: ["userName", "enquiryId", "executiveName", "executiveMobile"],
  },

  interested: {
    name: "interested_lead_after_call_premium",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile,
    ],
    required: ["userName", "enquiryId", "executiveName", "executiveMobile"],
  },

  switch_off: {
    name: "switch_off_followup",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile,
    ],
    required: ["userName", "enquiryId", "executiveName", "executiveMobile"],
  },

  // 🔥 NEW REMARKS

  meeting_scheduled_online: {
    name: "meeting_scheduled_online",
    params: (d) => {
      const [date, time] = (d.meetingDate || "").split("T");
      return [
        d.userName,
        date,
        time,
        `${d.meetingLink} ID: ${d.meetingId || "N/A"} Pass: ${d.passcode || "N/A"}`,
      ];
    },
    required: ["userName", "meetingDate", "meetingLink", "meetingId"],
  },

  meeting_scheduled_offline: {
    name: "meeting_scheduled_offline",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.meetingDate,
      d.meetingLocation,
    ],
    required: ["userName", "enquiryId", "meetingDate", "meetingLocation"],
  },

  followup_reminder: {
    name: "followup_reminder",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.followupDate,
    ],
    required: ["userName", "enquiryId", "followupDate"],
  },
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

    const config = CAMPAIGN_CONFIG[remark];

    if (!config) {
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

    /* ===== DYNAMIC FIELD VALIDATION ===== */

    for (const field of config.required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    /* ===== SAFE USERNAME (AiSensy Rule) ===== */

    const safeUserName =
      userName.replace(/[^a-zA-Z0-9]/g, "") || "User";

    /* ===== PAYLOAD BUILD ===== */

    const payload = {
      apiKey: process.env.AISENSY_API_KEY,
      campaignName: config.name,
      destination: formattedNumber,
      userName: safeUserName,
      templateParams: config.params(body),
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
      triggeredCampaign: config.name,
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
