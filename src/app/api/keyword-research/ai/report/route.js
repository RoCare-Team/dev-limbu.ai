import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  try {
    const { reportId, userId, savedCount } = await req.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { success: false, error: "reportId and userId are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const report = await KeywordResearchReport.findOneAndUpdate(
      { _id: reportId, userId },
      { savedCount: savedCount ?? 0 },
      { new: true }
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const userId = searchParams.get("userId");

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

    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
