import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

const TASK_ID_PATTERN = /^[a-f0-9]{32}$/i;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId") || "";

    if (!TASK_ID_PATTERN.test(taskId)) {
      return NextResponse.json({ success: false, error: "A valid taskId is required." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(`${CGI_VIDEO_API_URL}/api/task/${taskId}`, {
        headers: cgiVideoHeaders(),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await readUpstreamJson(externalRes);

    if (!externalRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            externalRes.status === 404
              ? "This job no longer exists on the video server."
              : upstreamErrorMessage(externalRes.status, data, "Failed to check the ad status."),
        },
        { status: externalRes.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("CGI VIDEO TASK ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.name === "AbortError" ? "Status check timed out." : error.message },
      { status: error.name === "AbortError" ? 504 : 500 }
    );
  }
}
