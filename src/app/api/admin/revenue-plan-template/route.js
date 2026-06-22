


import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";
const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;

function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.startsWith("0")) {
    n = n.slice(1);
  }

  if (n.length === 10) {
    n = "91" + n;
  }

  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
}

export async function POST(req) {
  try {
  const {
  phone,
  firstName,
  planName,
  amount,
  startDate,
  expiryDate,
  invoiceUrl,
} = await req.json();

    const destination = normalizeNumber(phone);

    if (!destination) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }

    const payload = {
      apiKey: API_KEY,
      campaignName: "plan_package_renewed",
      destination,
      userName: "YOUR_BRAND_NAME",


      templateParams: [
  "$FirstName",
  "$PlanName",
  "$Amount",
  "$StartDate",
  "$ExpiryDate"
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
  PlanName: planName || "-",
  Amount: String(amount || "0"),
  StartDate: startDate || "-",
  ExpiryDate: expiryDate || "-"
},
    };

    // console.log("Revenue Payload:", payload);

    // console.log("Revenue Payload:", JSON.stringify(payload, null, 2));
    const response = await fetch(AISENSY_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await response.json();

// console.log("================================");
// console.log("AiSensy Status:", response.status);
// console.log("AiSensy Response:", JSON.stringify(data, null, 2));
// console.log("================================");

if (!response.ok) {
  return NextResponse.json(
    {
      success: false,
      response: data,
    },
    { status: response.status }
  );
}

return NextResponse.json({
  success: true,
  response: data,
});

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}