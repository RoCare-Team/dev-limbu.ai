import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

/**
 * Sends the previously generated business-report PDF to the user's WhatsApp
 * as a document, via the Limbu WhatsApp campaign API.
 *
 * The approved template/campaign name is read from REPORT_WA_CAMPAIGN so it can
 * be swapped once the template is finalised (falls back to "Business-Report-Doc").
 */
export async function POST(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId })
      .select("fullName phone mobileNumber businessReport")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const pdfUrl = user?.businessReport?.pdfUrl;
    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: "No report generated for this user yet" },
        { status: 400 },
      );
    }

    const rawPhone = user.phone || user.mobileNumber || "";
    const phone = String(rawPhone).replace(/\D/g, "");
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "User has no phone number" },
        { status: 400 },
      );
    }

    const campaignName =
      process.env.REPORT_WA_CAMPAIGN || "Business-Report-Doc";

    const businessName =
      user?.businessReport?.businessName || user.fullName || "your business";

    const whatsappRes = await fetch(
      "https://whatsapp.limbu.ai/api/campaigns/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,
          campaignName,
          destination: phone,
          userName: "Limbu AI",
          templateParams: [user.fullName || "Customer", businessName],
          source: "api",
          media: {
            url: pdfUrl,
            filename: `Business-Report-${businessName}.pdf`.replace(
              /[^a-z0-9.\- ]/gi,
              "",
            ),
          },
          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {},
          paramsFallbackValue: {
            FirstName: user.fullName || "Customer",
          },
        }),
      },
    );

    const result = await whatsappRes.json().catch(() => ({}));

    if (!whatsappRes.ok) {
      return NextResponse.json(
        { success: false, error: "WhatsApp API failed", response: result },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, response: result });
  } catch (error) {
    console.error("business-report/send-whatsapp error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
