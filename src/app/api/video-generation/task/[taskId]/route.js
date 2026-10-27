import { NextResponse } from "next/server";
import { getVideoTask } from "@/lib/textToVideoApi";

export const dynamic = "force-dynamic";

/**
 * GET /api/video-generation/task/:taskId
 *
 * Status of a generation started with wait=false. Poll every few seconds until
 * data.status is "success" (data.video_url is set) or "failed" (data.error).
 * Keeps the API key on the server — clients never call the video service directly.
 */
export async function GET(req, { params }) {
  try {
    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId is required." }, { status: 400 });
    }

    const { ok, status, data } = await getVideoTask(taskId);
    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.detail || data?.error || "Unable to fetch video status.",
          details: data,
        },
        { status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("VIDEO TASK STATUS ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
