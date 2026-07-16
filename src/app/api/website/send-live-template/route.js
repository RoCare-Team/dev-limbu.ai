import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;

const CAMPAIGN_NAME = "website_uri_send";

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
    const { phone, firstName, businessName, liveUrl } = body;

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

    // Variable 1 = business name, Variable 2 = website URI
    const payload = {
      apiKey: API_KEY,
      campaignName: CAMPAIGN_NAME,
      destination: destination,
      userName: "YOUR_BRAND_NAME",
      templateParams: [businessName || firstName || "", liveUrl || ""],
      source: "api",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: businessName || firstName || "there",
        LastName: liveUrl || "",
      },
    };

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Website Go-Live WhatsApp Template Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send template",
      },
      { status: 500 }
    );
  }
}
