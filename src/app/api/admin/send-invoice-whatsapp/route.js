

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";

export async function POST(req) {
  try {
    await connectDB();

    const { revenueId } = await req.json();

    const revenue = await FranchiseRevenue.findById(revenueId);

    if (!revenue) {
      return NextResponse.json({
        success: false,
        message: "Revenue not found",
      });
    }

    const phone =
      revenue.phone ||
      revenue.mobile ||
      revenue.customerPhone;

    if (!phone) {
      return NextResponse.json({
        success: false,
        message: "Phone number not found",
      });
    }

    // Invoice URL
    const invoiceUrl =
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/invoice-tax?id=${revenue._id}`;

    const whatsappRes = await fetch(
      "https://whatsapp.limbu.ai/api/campaigns/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,

          campaignName: "Invoice-send Doc",

          destination: phone.replace(/\D/g, ""),

          userName: "Limbu AI",

          templateParams: [
            revenue.leadName || "Customer",
          ],

          source: "api",

          media: {
            url: invoiceUrl,
            filename: `Invoice-${revenue._id}.pdf`,
          },

          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {},

          paramsFallbackValue: {
            FirstName:
              revenue.leadName || "Customer",
          },
        }),
      }
    );

    const result = await whatsappRes.json();

    console.log("WHATSAPP API RESPONSE =>", result);

    return NextResponse.json({
      success: true,
      response: result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}