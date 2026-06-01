import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

const GMB_HEALTH_WEBHOOK =
  "https://n8n.limbutech.in/webhook/10d9cd54-46a7-4c3b-9c61-0ce9cf666eac";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const userId = body?.userId;
    const locationId = body?.locationId;
    const accountId = body?.accountId || "";

    if (!userId || !locationId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or locationId" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({
      userId,
      locationId,
    });

    const upstream = await fetch(GMB_HEALTH_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          location_id: locationId,
          account_id: accountId,
          token: accessToken,
        },
      ]),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: text || "Health audit failed" },
        { status: upstream.status },
      );
    }

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Received empty response from health audit" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, data: JSON.parse(text) });
  } catch (error) {
    console.error("GMB health audit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
