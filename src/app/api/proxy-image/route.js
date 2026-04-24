import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
        return NextResponse.json({ error: "Missing url param" }, { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            // ✅ Important: no CORS restriction on server side
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Upstream fetch failed", status: response.status }, { status: 502 });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/png";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Proxy image error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}