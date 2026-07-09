import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { uploadToS3 } from "@/utils/s3Config";
import { generateBusinessReportPDFBuffer } from "@/lib/generateBusinessReportPDF";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Saves the selected Google Places business to the user, generates a
 * Limbu-watermarked PDF report, uploads it to S3, and returns the URL.
 * If a fresh (<10 day) report already exists for the same place, reuses it.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const { userId, place, businessName, city } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }
    if (!place || typeof place !== "object") {
      return NextResponse.json(
        { success: false, error: "No business selected" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const placeId = place.id || place.placeId || "";
    const existing = user.businessReport;
    const fetchedAt = existing?.fetchedAt
      ? new Date(existing.fetchedAt).getTime()
      : 0;
    const isFresh = fetchedAt && Date.now() - fetchedAt < TEN_DAYS_MS;

    // Reuse cached report (same place, still fresh, pdf already built).
    if (isFresh && existing?.pdfUrl && existing?.placeId === placeId) {
      return NextResponse.json({
        success: true,
        cached: true,
        pdfUrl: existing.pdfUrl,
        fetchedAt: existing.fetchedAt,
      });
    }

    // Pass the admin-entered city so the report subtitle is accurate.
    const placeForPdf = { ...place, businessReportCity: city || "" };
    const pdfBuffer = await generateBusinessReportPDFBuffer(placeForPdf);

    const safeName = (place?.displayName?.text || place?.displayName || "report")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 40);
    const fileName = `business-report-${safeName || "report"}-${Date.now()}.pdf`;

    const uploadResult = await uploadToS3(
      pdfBuffer,
      fileName,
      "application/pdf",
      "business-reports",
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "S3 upload failed" },
        { status: 500 },
      );
    }

    const now = new Date();
    user.businessReport = {
      placeId,
      businessName:
        businessName || place?.displayName?.text || place?.displayName || "",
      city: city || "",
      place,
      pdfUrl: uploadResult.url,
      fetchedAt: now,
      generatedAt: now,
    };
    await user.save();

    return NextResponse.json({
      success: true,
      cached: false,
      pdfUrl: uploadResult.url,
      fetchedAt: now,
    });
  } catch (error) {
    console.error("business-report/generate error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
