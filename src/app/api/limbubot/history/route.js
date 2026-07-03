import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatbotMessage from "@/models/ChatbotMessage";

export const dynamic = "force-dynamic";

const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE ||
  "https://whatsapp.limbu.ai/api/external/contact";

const WHATSAPP_EXTERNAL_API_KEY =
  process.env.WHATSAPP_EXTERNAL_API_KEY ||
  process.env.LIMBUBOT_ADMIN_API_KEY ||
  process.env.LIMBUBOT_ADMIN_TOKEN ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

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

    // ── DB-first: serve real-time history captured by the webhook. Falls
    // through to the external API below only when we have nothing stored yet
    // (e.g. old conversations from before the webhook was live). ──
    try {
      await dbConnect();
      const waId = `wa_${phone}`;
      const phone10 = phone.length === 12 ? phone.slice(2) : phone;
      const rows = await ChatbotMessage.find({
        $or: [{ waId }, { phone: phone10 }],
      })
        .sort({ timestamp: 1, createdAt: 1 })
        .lean();

      if (rows.length > 0) {
        const history = rows.map((m) => ({
          id: m.wamid || String(m._id),
          role: m.direction === "outbound" ? "assistant" : "user",
          type: m.type || "text",
          content: String(m.content || ""),
          status: "",
          time: m.timestamp ? new Date(m.timestamp).toISOString() : "",
          created_at: m.createdAt ? new Date(m.createdAt).toISOString() : "",
        }));

        return NextResponse.json({
          success: true,
          source: "db",
          user_id: `wa_${phone}`,
          contact: { name: rows[rows.length - 1]?.name || "" },
          history,
        });
      }
    } catch (dbErr) {
      // DB glitch → fall back to the external API rather than failing.
      console.error("[limbubot/history] db read failed:", dbErr.message);
    }

    const url = new URL(LIMBUBOT_HISTORY_BASE);
    url.searchParams.set("phone", phone);

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": WHATSAPP_EXTERNAL_API_KEY,
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
