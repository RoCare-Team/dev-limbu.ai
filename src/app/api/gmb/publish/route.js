import { NextResponse } from "next/server";

export const maxDuration = 300;

const GMB_PUBLISH_URL =
  process.env.GMB_PUBLISH_URL ||
  process.env.GMB_POST_API_URL ||
  "https://gmb-post.limbutech.in/gmb-post";

const GMB_API_SECRET =
  process.env.GMB_API_SECRET || "Xk9mP2qR8vLnJ4wZ7dF3yT6hQ1GMB";

const parseUpstreamResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

export async function POST(req) {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "Payload missing" },
        { status: 400 },
      );
    }

    console.log("[gmb/publish] Incoming request:", {
      account: payload.account,
      locationDataCount: Array.isArray(payload.locationData)
        ? payload.locationData.length
        : 0,
      hasOutput: Boolean(payload.output),
      hasVideo: Boolean(payload.video_url),
      checkmark: payload.checkmark,
      postType: payload.post_type,
      cta: payload.cta,
    });

    const response = await fetch(GMB_PUBLISH_URL.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${GMB_API_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await parseUpstreamResponse(response);

    console.log("[gmb/publish] Upstream response:", {
      status: response.status,
      ok: response.ok,
      hasSuccessList: Array.isArray(data?.success),
      hasFailList: Array.isArray(data?.fail),
    });

    return NextResponse.json(
      {
        ok: response.ok,
        data,
      },
      { status: response.ok ? 200 : response.status || 502 },
    );
  } catch (error) {
    console.error("[gmb/publish] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Network error during GMB publish.",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
