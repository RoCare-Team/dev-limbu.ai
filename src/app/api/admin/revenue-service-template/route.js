

import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";
const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;

function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.length === 10) {
    n = "91" + n;
  }

  return n;
}

export async function POST(req) {
  try {
    const {
      phone,
      firstName,
      serviceName,
      amount,
      invoiceUrl,
    } = await req.json();

    const destination = normalizeNumber(phone);

    const payload = {
      apiKey: API_KEY,
      campaignName: "service_renewe_templ",
      destination,
      userName: "YOUR_BRAND_NAME",

      templateParams: [
        "$FirstName",
        "$LastName",
        "$Phone"
      ],

      source: "api",

      media: {
        url: invoiceUrl,
        filename: "invoice.pdf",
      },

      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},

      paramsFallbackValue: {
        FirstName: firstName || "Customer",
        LastName: serviceName || "-",
        Phone: String(amount || "0"),
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

    return NextResponse.json({
      success: response.ok,
      response: data,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}