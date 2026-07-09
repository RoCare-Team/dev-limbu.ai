import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";

export const dynamic = "force-dynamic";

const VALID = ["pending", "approved", "rejected"];

/* -------------------- GET: latest report (to restore state after refresh) -------------------- */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const query = { userId };
    if (slug) query.slug = slug;

    const report = await KeywordResearchReport.findOne(query).sort({ updatedAt: -1 });

    if (!report) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        pdfUrl: report.pdfUrl,
        pdfStatus: report.pdfStatus,
        approvalStatus: report.approvalStatus || "pending",
        approvalNote: report.approvalNote || "",
        approvalUpdatedAt: report.approvalUpdatedAt,
      },
    });
  } catch (err) {
    console.error("[keyword-approval-status-get]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load report" },
      { status: 500 }
    );
  }
}

/* -------------------- PATCH: update client approval status -------------------- */
export async function PATCH(req) {
  try {
    await dbConnect();
    const { reportId, userId, approvalStatus, approvalNote } = await req.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { success: false, error: "reportId and userId are required" },
        { status: 400 }
      );
    }

    if (!VALID.includes(approvalStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid approvalStatus" },
        { status: 400 }
      );
    }

    const report = await KeywordResearchReport.findOneAndUpdate(
      { _id: reportId, userId },
      {
        approvalStatus,
        approvalNote: approvalNote || "",
        approvalUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        approvalStatus: report.approvalStatus,
        approvalNote: report.approvalNote,
        approvalUpdatedAt: report.approvalUpdatedAt,
      },
    });
  } catch (err) {
    console.error("[keyword-approval-status]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
