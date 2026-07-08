import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";
import { generateSavedKeywordsPdf } from "@/lib/keywordResearchPdfGenerator";
import { uploadToS3 } from "@/utils/s3Config";

export const dynamic = "force-dynamic";

const KeywordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    source: { type: String, default: "google" },
    volume: { type: Number },
    competition: { type: String },
  },
  { timestamps: true }
);

const Keyword = mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

export async function POST(req) {
  let reportId;
  try {
    const body = await req.json();
    const { userId, businessName, locationName } = body;
    reportId = body.reportId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    await dbConnect();

    const savedKeywords = await Keyword.find({ userId }).sort({ createdAt: -1 });

    if (savedKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "No saved keywords found. Save keywords first." },
        { status: 400 }
      );
    }

    const keywords = savedKeywords.map((k) => ({
      keyword: k.keyword,
      volume: k.volume,
      competition: k.competition,
    }));

    const pdfBuffer = await generateSavedKeywordsPdf({
      businessName: businessName || "My Business",
      locationName: locationName || "",
      keywords,
    });

    const safeName = (businessName || "Keywords").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const fileName = `Keyword_Report_${safeName}_${Date.now()}.pdf`;
    const uploadResult = await uploadToS3(pdfBuffer, fileName, "application/pdf");

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "Failed to upload PDF" },
        { status: 500 }
      );
    }

    let report;
    if (reportId) {
      report = await KeywordResearchReport.findOneAndUpdate(
        { _id: reportId, userId },
        {
          pdfUrl: uploadResult.url,
          pdfStatus: "generated",
          pdfError: "",
          keywords,
          businessName: businessName || "My Business",
          locationName: locationName || "",
        },
        { new: true }
      );
    }

    if (!report) {
      report = await KeywordResearchReport.create({
        userId,
        businessName: businessName || "My Business",
        locationName: locationName || "",
        slug: body.slug || "",
        keywords,
        reportType: "saved",
        aiSummary: `Keyword research report with ${keywords.length} saved keywords.`,
        pdfUrl: uploadResult.url,
        pdfStatus: "generated",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        pdfUrl: report.pdfUrl,
        pdfStatus: report.pdfStatus,
        keywordCount: keywords.length,
      },
    });
  } catch (err) {
    console.error("[keyword-export-pdf]", err);
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
