import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { sendWelcomeBonusAisensy } from "@/lib/welcomeBonusWhatsApp";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { destination, templateParams, campaignName, source } = body;

    if (!destination || !templateParams) {
      return NextResponse.json(
        { success: false, message: "destination & templateParams are required" },
        { status: 400 }
      );
    }

    const { ok, data: result, status } = await sendWelcomeBonusAisensy({
      destination,
      templateParams,
      campaignName: campaignName || "welcome_bonus",
      source: source || "new-landing-page form",
    });

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp API did not accept the request",
          data: result,
        },
        { status: status >= 400 ? status : 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyExists: false,
        message: "Message sent successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
