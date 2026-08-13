import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import AiContentReport, {
  AI_CONTENT_REPORT_REASONS,
  AI_CONTENT_REPORT_MEDIA_TYPES,
} from "@/models/AiContentReport";

const str = (v) => (typeof v === "string" ? v.trim() : "");

function parseReportedAt(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * POST /api/ai-content-report
 * Body: { postId, userId, reason, details?, mediaType?, mediaUrl?, source?, reportedAt? }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const userId = str(body.userId);
    const reason = str(body.reason).toLowerCase();
    const postId = str(body.postId);
    const mediaUrl = str(body.mediaUrl);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    if (!AI_CONTENT_REPORT_REASONS.includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          message: `reason must be one of: ${AI_CONTENT_REPORT_REASONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!postId && !mediaUrl) {
      return NextResponse.json(
        { success: false, message: "postId or mediaUrl is required" },
        { status: 400 }
      );
    }

    const mediaType = str(body.mediaType).toLowerCase();

    await connectDB();

    const report = await AiContentReport.create({
      postId,
      userId,
      reason,
      details: str(body.details).slice(0, 2000),
      mediaType: AI_CONTENT_REPORT_MEDIA_TYPES.includes(mediaType)
        ? mediaType
        : "image",
      mediaUrl,
      source: str(body.source),
      reportedAt: parseReportedAt(body.reportedAt),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted",
        reportId: report._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("AI_CONTENT_REPORT_POST_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-content-report?userId=&postId=&status=&page=1&limit=20
 * Moderation / listing helper — newest first.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const query = {};
    const userId = str(searchParams.get("userId"));
    const postId = str(searchParams.get("postId"));
    const status = str(searchParams.get("status"));
    if (userId) query.userId = userId;
    if (postId) query.postId = postId;
    if (status) query.status = status;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    await connectDB();

    const [reports, total] = await Promise.all([
      AiContentReport.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AiContentReport.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      reports,
    });
  } catch (error) {
    console.error("AI_CONTENT_REPORT_GET_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
