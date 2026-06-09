import { NextResponse } from "next/server";

const N8N_INHOUSE_PINTEREST_URL =
  "https://n8n.limbutech.in/webhook/limbu_inhouse_pintrest";

export async function POST(req) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json(
        { success: false, error: "image_url is required." },
        { status: 400 },
      );
    }

    const response = await fetch(N8N_INHOUSE_PINTEREST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || "Failed to generate Pinterest content.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, content: data });
  } catch (error) {
    console.error("Inhouse Pinterest content error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Content generation failed." },
      { status: 500 },
    );
  }
}
