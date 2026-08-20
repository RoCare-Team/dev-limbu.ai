import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // videos can be a few MB — allow a generous window on slow connections

// Generic download proxy — fetches a remote file (S3 video, image, etc.) server-side and
// streams it back with a Content-Disposition header, so the browser's <a download> click
// always works even when the source host (e.g. S3) doesn't allow cross-origin fetch/blob reads.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "download";

    if (!url) {
      return NextResponse.json({ success: false, error: "url query param is required." }, { status: 400 });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid url." }, { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ success: false, error: "Invalid url protocol." }, { status: 400 });
    }

    let upstream;
    try {
      upstream = await fetch(url);
    } catch (fetchErr) {
      console.error("DOWNLOAD PROXY — upstream fetch failed:", fetchErr);
      return NextResponse.json(
        { success: false, error: `Could not reach the file's source: ${fetchErr.message}` },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      console.error("DOWNLOAD PROXY — upstream returned", upstream.status, url);
      return NextResponse.json(
        { success: false, error: `Source returned ${upstream.status} ${upstream.statusText}.` },
        { status: 502 }
      );
    }

    // Buffer fully rather than pipe the raw stream through — sidesteps runtime-specific quirks
    // with re-streaming an undici ReadableStream through NextResponse and gives an accurate,
    // non-mismatched Content-Length so the browser never aborts the download mid-way.
    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(arrayBuffer.byteLength),
        "Content-Disposition": `attachment; filename="${filename.replace(/[":\\]/g, "")}"`,
      },
    });
  } catch (error) {
    console.error("DOWNLOAD PROXY ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "Download failed." }, { status: 500 });
  }
}
