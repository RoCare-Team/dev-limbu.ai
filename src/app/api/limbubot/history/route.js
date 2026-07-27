import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE ||
  "https://whatsapp.limbu.ai/api/external/contact";

const WHATSAPP_EXTERNAL_API_KEY =
  process.env.WHATSAPP_EXTERNAL_API_KEY ||
  process.env.LIMBUBOT_ADMIN_API_KEY ||
  process.env.LIMBUBOT_ADMIN_TOKEN ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

// 👇 Franchise page ke liye alag key
const FRANCHISE_WHATSAPP_API_KEY =
  process.env.FRANCHISE_WHATSAPP_API_KEY ||
  "ws_fca30eb07595f51089b57a862ecac20c12947558b56f1a70";

function normalizePhoneE164(value) {
  let digits = String(value || "").replace(/^wa_/i, "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function mapWhatsAppMessageToHistory(message = {}) {
  return {
    id: message.id,
    role:
      String(message.direction || "").toLowerCase() === "inbound"
        ? "user"
        : "assistant",
    type: message.type || "text",
    content: String(message.content || ""),
    status: message.status || "",
    time: message.sent_at || message.created_at || "",
    created_at: message.created_at || "",
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("user_id") || "").trim();
    const source = String(searchParams.get("source") || "").trim().toLowerCase();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 },
      );
    }

    const phone = normalizePhoneE164(userId);
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "valid WhatsApp phone is required" },
        { status: 400 },
      );
    }

    // 👇 Source ke hisaab se API key select karo
    const apiKey =
      source === "franchise"
        ? FRANCHISE_WHATSAPP_API_KEY
        : WHATSAPP_EXTERNAL_API_KEY;

    // ── Always fetch live history straight from the external WhatsApp API. ──
    const url = new URL(LIMBUBOT_HISTORY_BASE);
    url.searchParams.set("phone", phone);

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

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
      source: "external",
      user_id: data?.user_id || `wa_${phone}`,
      contact: data?.contact || null,
      history: Array.isArray(data?.history)
        ? data.history
        : Array.isArray(data?.messages)
          ? data.messages.map(mapWhatsAppMessageToHistory)
          : [],
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