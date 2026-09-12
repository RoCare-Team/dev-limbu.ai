import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

export async function GET() {
  try {
    const res = await fetch(`${CGI_VIDEO_API_URL}/api/music-library`, {
      headers: cgiVideoHeaders(),
      cache: "no-store",
    });
    const data = await readUpstreamJson(res);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: upstreamErrorMessage(res.status, data, "Failed to load music moods.") },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, tracks: Array.isArray(data.tracks) ? data.tracks : [] });
  } catch (error) {
    console.error("CGI VIDEO MUSIC LIBRARY ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
