import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";
import { generateKeywordResearchPdf } from "@/lib/keywordResearchPdfGenerator";
import { uploadToS3 } from "@/utils/s3Config";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let reportId;
  try {
    const body = await req.json();
    reportId = body.reportId;
    const { userId } = body;

    if (!reportId || !userId) {
      return NextResponse.json(
        { success: false, error: "reportId and userId are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const report = await KeywordResearchReport.findOne({ _id: reportId, userId });
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    await KeywordResearchReport.findByIdAndUpdate(reportId, {
      pdfStatus: "generating",
      pdfError: "",
    });

    const pdfBuffer = await generateKeywordResearchPdf({
      businessName: report.businessName,
      aiSummary: report.aiSummary,
      inferredCategory: report.inferredCategory,
      inferredServices: report.inferredServices,
      locationName: report.locationName,
      keywords: report.keywords,
    });

    const safeName = report.businessName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const fileName = `Keyword_Research_${safeName}_${Date.now()}.pdf`;

    const uploadResult = await uploadToS3(pdfBuffer, fileName, "application/pdf");
    if (!uploadResult.success) {
      await KeywordResearchReport.findByIdAndUpdate(reportId, {
        pdfStatus: "failed",
        pdfError: uploadResult.error || "S3 upload failed",
      });
      return NextResponse.json(
        { success: false, error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    const updated = await KeywordResearchReport.findByIdAndUpdate(
      reportId,
      {
        pdfUrl: uploadResult.url,
        pdfStatus: "generated",
        pdfError: "",
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: {
        reportId: updated._id,
        pdfUrl: updated.pdfUrl,
        pdfStatus: updated.pdfStatus,
      },
    });
  } catch (err) {
    console.error("[ai-keyword-pdf]", err);

    if (reportId) {
      try {
        await dbConnect();
        await KeywordResearchReport.findByIdAndUpdate(reportId, {
          pdfStatus: "failed",
          pdfError: err.message,
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json(
      { success: false, error: err.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}
