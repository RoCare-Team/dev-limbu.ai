import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

// Upstream job ids are 32-char hex today; kept loose so a format change on their
// side doesn't break polling, while still refusing anything path-unsafe.
const JOB_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    // `taskId` is the historical param name — `jobId` matches the v1 API.
    const jobId = (searchParams.get("jobId") || searchParams.get("taskId") || "").trim();

    if (!JOB_ID_PATTERN.test(jobId)) {
      return NextResponse.json({ success: false, error: "A valid job id is required." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(`${CGI_VIDEO_API_URL}/api/v1/ads/${jobId}`, {
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
