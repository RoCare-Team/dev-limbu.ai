import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Turns an image-generation prompt into a short video prompt optimized for motion
 * (camera moves, subject movement, lighting, particles, liquid flow, etc.).
 */
export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const raw = typeof body.imagePrompt === "string" ? body.imagePrompt.trim() : "";
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "imagePrompt is required." },
        { status: 400 }
      );
    }

    const system = `You write concise prompts for image-to-video AI tools. The output must describe MOTION and CHANGE over time — not a static scene.
Rules:
- One or two short sentences, plain text, no markdown, no quotes around the whole answer.
- Emphasize: camera movement (slow pan, dolly, orbit, gentle push-in), subject motion (steam rising, liquid flowing, lights pulsing, fabric moving, particles drifting), environmental motion (bokeh shifting, reflections rippling).
- Keep brand/product identity from the image prompt; do not invent new products or text overlays unless the image prompt already mentions them.
- Avoid "static", "frozen", "still image", "no movement".`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Image generation prompt:\n${raw}\n\nRewrite as a video motion prompt (English).`,
          },
        ],
        temperature: 0.75,
        max_tokens: 220,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[image-prompt-to-video-prompt]", data);
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || "OpenAI request failed.",
        },
        { status: 502 }
      );
    }

    let videoPrompt = data.choices?.[0]?.message?.content?.trim() || "";
    videoPrompt = videoPrompt.replace(/^["']|["']$/g, "").trim();

    if (!videoPrompt) {
      return NextResponse.json(
        { success: false, error: "Empty model response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, videoPrompt });
  } catch (e) {
    console.error("[image-prompt-to-video-prompt]", e);
    return NextResponse.json(
      { success: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
