import { NextResponse } from "next/server";
import { uploadToS3 } from "@/utils/s3Config";
import {
  normalizeWhatsAppPhone,
  sendCompetitorAnalysisWhatsApp,
} from "@/lib/competitorAnalysisWhatsApp";

/**
 * Uploads the client-generated Competitor Analysis PDF to S3, then sends it
 * to the given WhatsApp number via the "competitor_analysis_report_2" template.
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const phone = formData.get("phone");
    const firstName = formData.get("firstName") || "there";
    const businessName = formData.get("businessName") || "business";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing PDF file" },
        { status: 400 },
      );
    }

    const destination = normalizeWhatsAppPhone(phone);
    if (!destination) {
      return NextResponse.json(
        { success: false, error: "Enter a valid 10-digit WhatsApp number" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = String(businessName)
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    const fileName = `Competitor-Analysis-${safeName || "report"}-${Date.now()}.pdf`;

    const uploadResult = await uploadToS3(buffer, fileName, "application/pdf");
    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "PDF upload failed" },
        { status: 500 },
      );
    }

    const result = await sendCompetitorAnalysisWhatsApp({
      destination,
      firstName,
      pdfUrl: uploadResult.url,
      pdfFilename: fileName,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, response: result.waData },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      pdfUrl: uploadResult.url,
      response: result.waData,
    });
  } catch (error) {
    console.error("competitor-analysis/send-whatsapp error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
