import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import {
  normalizeWhatsAppPhone,
  sendInsightsReportWhatsApp,
} from "@/lib/insightsReportWhatsApp";
import { uploadToS3 } from "@/utils/s3Config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const formatDateLabel = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export async function POST(req) {
  try {
    const { userId, businessName, startDate, endDate, pdfBase64 } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const startLabel = formatDateLabel(startDate);
    const endLabel = formatDateLabel(endDate);

    if (!startLabel || !endLabel) {
      return NextResponse.json(
        { success: false, error: "Valid report start and end dates are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const destination = normalizeWhatsAppPhone(user.phone || user.mobileNumber);
    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account mobile number is missing or invalid. Update it in profile settings.",
        },
        { status: 400 }
      );
    }

    const customerName = (businessName || user.fullName || "Customer").trim();
    const safeName = (businessName || "Business").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const fileName = `Insights_Report_${safeName}.pdf`;

    // Upload the dynamic insights PDF (generated client-side) to S3 so WhatsApp can
    // fetch it as a document. If no PDF was sent, the helper falls back to an image.
    let documentUrl = "";
    if (pdfBase64) {
      const up = await uploadToS3(pdfBase64, fileName, "application/pdf", "reports");
      if (up.success && up.url) {
        documentUrl = up.url;
      } else {
        console.error("[insights-send-whatsapp] PDF upload failed:", up.error);
        return NextResponse.json(
          { success: false, error: `Could not upload report PDF: ${up.error || "S3 error"}` },
          { status: 502 }
        );
      }
    }

    const result = await sendInsightsReportWhatsApp({
      destination,
      customerName,
      startLabel,
      endLabel,
      documentUrl,
      fileName,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Report sent to your WhatsApp (${destination})`,
      data: result.waData,
    });
  } catch (err) {
    console.error("[insights-send-whatsapp]", err);
    return NextResponse.json(
      { success: false, error: err.message || "WhatsApp send failed" },
      { status: 500 }
    );
  }
}
