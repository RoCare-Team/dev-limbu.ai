import { NextResponse } from "next/server";

const DEFAULT_WEBHOOK = "https://limbubot.limbutech.in/webhook/chat";

export async function POST(request) {
  try {
    const webhookUrl = process.env.LIMBU_AI_WEBHOOK_URL || DEFAULT_WEBHOOK;
    const webhookToken = process.env.LIMBU_AI_WEBHOOK_TOKEN;

    const contentType = request.headers.get("content-type") || "";
    let message = "";
    let userId = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      message = body.message?.toString()?.trim() || "";
      userId = body.user_id?.toString()?.trim() || "";
    } else {
      const incomingForm = await request.formData();
      message = incomingForm.get("message")?.toString()?.trim() || "";
      userId = incomingForm.get("user_id")?.toString()?.trim() || "";
    }

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const headers = { "Content-Type": "application/json" };
    if (webhookToken) {
      headers.Authorization = `Bearer ${webhookToken}`;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, user_id: userId }),
      cache: "no-store",
    });

    const resContentType = response.headers.get("content-type") || "";
    let responseData;
    try {
      responseData = resContentType.includes("application/json")
        ? await response.json()
        : { raw: await response.text() };
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            responseData?.error ||
            responseData?.message ||
            responseData?.raw ||
            "Chat request failed.",
        },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    const reply =
      responseData?.response ??
      responseData?.reply ??
      responseData?.message ??
      "";

    return NextResponse.json(
      {
        success: true,
        reply: reply || "No reply from assistant.",
        intent: responseData?.intent,
        status: responseData?.status,
        user_id: responseData?.user_id ?? userId,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to process chat message.",
      },
      { status: 500 }
    );
  }
}
