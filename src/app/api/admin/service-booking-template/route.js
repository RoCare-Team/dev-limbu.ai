// src/app/api/admin/send-invoice-whatsapp/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

// =====================================================
// Normalize Indian Number
// =====================================================
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

    // =====================================================
    // Revenue Record
    // =====================================================
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

    // =====================================================
    // User Details
    // =====================================================
    const userDetails = await User.findOne({
      userId: revenue.leadId,
    }).lean();

    // =====================================================
    // Phone Number
    // =====================================================
    const rawPhone =
      userDetails?.phone ||
      revenue.userPhone ||
      revenue.phone ||
      revenue.mobile ||
      revenue.whatsappNumber ||
      "";

    const destination = normalizeNumber(rawPhone);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number",
          rawPhone,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Template Variables
    // {{1}} = Name
    // {{2}} = Service Name
    // {{3}} = Amount
    // =====================================================

    const customerName =
      revenue.leadName ||
      revenue.name ||
      userDetails?.fullName ||
      userDetails?.name ||
      "Customer";

    const serviceName =
      revenue.planName ||
      revenue.serviceName ||
      revenue.service ||
      revenue.plan ||
      revenue.packageName ||
      revenue.package ||
      "Service";

    const amountPaid =
      revenue.amountPaid ||
      revenue.totalAmount ||
      revenue.amount ||
      revenue.paidAmount ||
      revenue.paymentAmount ||
      0;

    console.log("===== TEMPLATE VARIABLES =====");
    console.log("Customer Name:", customerName);
    console.log("Service Name:", serviceName);
    console.log("Amount Paid:", amountPaid);
    console.log("Destination:", destination);

    // =====================================================
    // WhatsApp Payload
    // =====================================================

    const payload = {
      apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,

      campaignName: "service_booking_new",

      destination,

      userName: "Limbu AI",

      templateParams: [
        customerName, // {{1}}
        serviceName, // {{2}}
        String(amountPaid), // {{3}}
      ],

      source: "api",

      media: {},

      buttons: [],

      carouselCards: [],

      location: {},

      attributes: {},

      paramsFallbackValue: {
        FirstName: customerName,
        ServiceName: serviceName,
        Amount: String(amountPaid),
      },
    };

    console.log("===== WHATSAPP PAYLOAD =====");
    console.log(JSON.stringify(payload, null, 2));

    // =====================================================
    // Send Template
    // =====================================================

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("===== WHATSAPP RESPONSE =====");
    console.log(JSON.stringify(data, null, 2));

    // =====================================================
    // Success Check
    // =====================================================

    const isSuccess =
      response.ok &&
      (
        data?.success === true ||
        data?.success === "true" ||
        !!data?.submitted_message_id
      );

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: "WhatsApp template sent successfully",
        destination,
        submitted_message_id:
          data?.submitted_message_id || null,
        response: data,
      });
    }

    // =====================================================
    // API Failure
    // =====================================================

    return NextResponse.json(
      {
        success: false,
        message:
          data?.message ||
          data?.error ||
          "No messages were sent",

        destination,
        response: data,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "SEND WHATSAPP TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to send WhatsApp template",
      },
      { status: 500 }
    );
  }
}