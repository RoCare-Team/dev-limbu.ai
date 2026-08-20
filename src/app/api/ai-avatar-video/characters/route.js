import { NextResponse } from "next/server";

const AVATAR_API_URL = "https://ai-avatar.limbutech.in";
const AVATAR_API_KEY =
  "b6e0fa3be252c49f443b49ecf4bb44e522e2d9f910784e6fa8f5b5f9ad9a0ff5";

export async function GET() {
  try {
    const res = await fetch(`${AVATAR_API_URL}/characters`, {
      headers: { "X-API-Key": AVATAR_API_KEY },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to load characters." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, characters: data.characters || [] });
  } catch (error) {
    console.error("AI AVATAR CHARACTERS ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
