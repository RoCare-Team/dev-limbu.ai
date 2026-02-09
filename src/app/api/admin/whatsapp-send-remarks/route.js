import { NextResponse } from "next/server";

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

/**
 * RULE (FIXED SEQUENCE):
 * {{1}} → userName
 * {{2}} → enquiryId
 * {{3}} → executiveName
 * {{4}} → executiveMobile
 * jitni zarurat ho, utni hi values bhejni hain
 */
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

  // 🔹 4 PARAMS
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
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { remark, destination, userName } = body;

    const config = CAMPAIGN_CONFIG[remark];
    if (!config) {
      return NextResponse.json(
        { success: false, message: "Invalid remark" },
        { status: 400 }
      );
    }

    if (!destination || !userName) {
      return NextResponse.json(
        { success: false, message: "destination and userName required" },
        { status: 400 }
      );
    }

    // 🔍 Dynamic field validation (campaign wise)
    for (const field of config.required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // 🔐 AiSensy rule: userName must be alphanumeric
    const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, "");

    const payload = {
      apiKey: process.env.AISENSY_API_KEY,
      campaignName: config.name,
      destination,
      userName: safeUserName || "User",

      // 🔥 ONLY ACTUAL VALUES (order matters)
      templateParams: config.params(body),

      source: "new-landing-page form",
    };

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
