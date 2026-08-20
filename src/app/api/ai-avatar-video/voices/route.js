import { NextResponse } from "next/server";

const AVATAR_API_URL = "https://ai-avatar.limbutech.in";
const AVATAR_API_KEY =
  "b6e0fa3be252c49f443b49ecf4bb44e522e2d9f910784e6fa8f5b5f9ad9a0ff5";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forwardParams = new URLSearchParams();
    const language = searchParams.get("language");
    const gender = searchParams.get("gender");
    if (language) forwardParams.set("language", language);
    if (gender) forwardParams.set("gender", gender);

    const qs = forwardParams.toString();
    const res = await fetch(`${AVATAR_API_URL}/voices${qs ? `?${qs}` : ""}`, {
      headers: { "X-API-Key": AVATAR_API_KEY },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to load voices." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, count: data.count || 0, voices: data.voices || [] });
  } catch (error) {
    console.error("AI AVATAR VOICES ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
