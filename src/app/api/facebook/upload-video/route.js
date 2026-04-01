import { NextResponse } from "next/server";

export const maxDuration = 300;

/**
 * Downloads a video from a public URL and uploads it to a Facebook Page using
 * multipart form-data with a `source` file (Graph API /{page-id}/videos).
 * Matches Postman: form-data source=File, description, access_token.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoUrl =
      typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
    const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
    const accessToken =
      typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    const description =
      typeof body.description === "string" ? body.description : "";

    if (!videoUrl || !pageId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "videoUrl, pageId, and accessToken are required.",
        },
        { status: 400 }
      );
    }

    if (!/^https?:\/\//i.test(videoUrl)) {
      return NextResponse.json(
        { success: false, error: "videoUrl must be an http(s) URL." },
        { status: 400 }
      );
    }

    const videoRes = await fetch(videoUrl, {
      headers: { Accept: "video/*,*/*" },
    });

    if (!videoRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not download video (HTTP ${videoRes.status}).`,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const maxBytes = 1024 * 1024 * 900;
    if (buffer.length > maxBytes) {
      return NextResponse.json(
        { success: false, error: "Video exceeds size limit." },
        { status: 400 }
      );
    }

    const contentType =
      videoRes.headers.get("content-type")?.split(";")[0]?.trim() ||
      "video/mp4";

    const formData = new FormData();
    const FileImpl = globalThis.File;
    if (typeof FileImpl === "function") {
      formData.append(
        "source",
        new FileImpl([buffer], "post-video.mp4", { type: contentType })
      );
    } else {
      const blob = new Blob([buffer], { type: contentType });
      formData.append("source", blob, "post-video.mp4");
    }
    formData.append("description", description);
    formData.append("access_token", accessToken);

    const fbUrl = `https://graph.facebook.com/v24.0/${encodeURIComponent(pageId)}/videos`;
    const fbRes = await fetch(fbUrl, { method: "POST", body: formData });
    const fbJson = await fbRes.json().catch(() => ({}));

    if (!fbRes.ok || !fbJson.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            fbJson.error?.message ||
            (typeof fbJson.error === "string" ? fbJson.error : null) ||
            "Facebook video upload failed.",
          details: fbJson,
        },
        { status: fbRes.ok ? 502 : fbRes.status }
      );
    }

    return NextResponse.json({ success: true, id: fbJson.id });
  } catch (e) {
    console.error("[facebook/upload-video]", e);
    return NextResponse.json(
      { success: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
