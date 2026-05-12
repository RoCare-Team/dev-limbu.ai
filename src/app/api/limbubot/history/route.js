import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE || "https://limbubot.limbutech.in/history";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("user_id") || "").trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 },
      );
    }

    const upstream = await fetch(
      `${LIMBUBOT_HISTORY_BASE}/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    const text = await upstream.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || "Failed to fetch chat history",
          data,
        },
        { status: upstream.status || 502 },
      );
    }

    return NextResponse.json({
      success: true,
      user_id: data?.user_id || userId,
      history: Array.isArray(data?.history) ? data.history : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Network error fetching chat history",
      },
      { status: 500 },
    );
  }
}
