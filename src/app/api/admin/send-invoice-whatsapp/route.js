

// src/app/api/admin/send-invoice-whatsapp/route.js
// ✅ Is file ko poora replace kar do

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

const LIMBU_API_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY = process.env.LIMBU_API_KEY;


export async function POST(req) {
  try {
    await connectDB();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 1. Revenue Record Fetch
    // ======================================================
    const revenue = await FranchiseRevenue.findById(userId).lean();

    if (!revenue) {
      return NextResponse.json(
        {
          success: false,
          message: "Revenue record not found",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 2. Actual User Details Fetch
    // ======================================================
    const userDetails = await User.findOne({
      userId: revenue.leadId,
    }).lean();

    // ======================================================
// 3. Mobile Number
// ======================================================
const mobile =
  userDetails?.phone ||
  revenue.userPhone ||
  revenue.phone ||
  revenue.mobile ||
  revenue.whatsappNumber ||
  "";

if (!mobile) {
  return NextResponse.json(
    {
      success: false,
      message: "User phone number not found",
    },
    { status: 400 }
  );
}

// ======================================================
// 3.1 Normalize Number → destination
// ======================================================
let destination = String(mobile).replace(/\D/g, "");

// Remove leading 0
if (destination.startsWith("0")) {
  destination = destination.slice(1);
}

// Add India country code if only 10 digits
if (destination.length === 10) {
  destination = "91" + destination;
}

// Validate final number
if (destination.length !== 12 || !destination.startsWith("91")) {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid phone number",
      mobile,
      destination,
    },
    { status: 400 }
  );
}

    // ======================================================
    // 4. Public Invoice URL
    // ======================================================
    // Localhost bhi kaam karega development me
    const origin = new URL(req.url).origin;

    const invoiceUrl =
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/invoice-tax?id=${userId}`;

console.log("Invoice URL:", invoiceUrl);

    // ======================================================
    // 5. Customer Name
    // ======================================================
    const customerName =
      revenue.leadName ||
      revenue.name ||
      userDetails?.name ||
      userDetails?.fullName ||
      "Customer";

    // ======================================================
    // 6. WhatsApp Payload
    // ======================================================
   const payload = {
  apiKey: API_KEY,
  campaignName: "invoice_send",
  destination: destination,
  userName: "YOUR_BRAND_NAME",
  templateParams: [customerName],
  source: "api",
  media: {
    url: invoiceUrl,
    filename: `Invoice-${customerName}.pdf`,
  },
  buttons: [],
  carouselCards: [],
  location: {},
  attributes: {},
  paramsFallbackValue: {},
};

    console.log("📤 WhatsApp Payload:", payload);

    // ======================================================
    // 7. Send to Limbu API
    // ======================================================
   const response = await fetch(LIMBU_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

    // Raw response text (better debugging)
    const rawText = await response.text();

    console.log("📥 Limbu Response:", rawText);

    let result = {};
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { raw: rawText };
    }

    // ======================================================
    // 8. Error Handling
    // ======================================================
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            result?.message ||
            result?.error ||
            "Failed to send invoice on WhatsApp",
          result,
          invoiceUrl,
          mobile,
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 9. Success
    // ======================================================
    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully on WhatsApp",
      result,
      invoiceUrl,
      mobile,
    });
  } catch (error) {
    console.error("SEND INVOICE WHATSAPP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}