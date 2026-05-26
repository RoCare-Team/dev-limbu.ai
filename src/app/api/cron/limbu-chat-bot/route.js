import { startChatbotSyncCron } from "@/lib/cron/chatbotSyncCron";
import { fetchLimbuBotAdminUsers } from "@/lib/limbuBotUserSync";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// NOTE on serverless environments (Vercel, Netlify, etc.):
//
// node-cron registered here will NOT fire reliably — serverless functions are
// killed after each request and the scheduled callbacks never execute.
//
// For Vercel: remove startChatbotSyncCron() entirely from here and instead add
// a cron entry in vercel.json that calls a dedicated POST /api/chatbot-sync route:
//
//   {
//     "crons": [{ "path": "/api/chatbot-sync", "schedule": "*/10 * * * *" }]
//   }
//
// For a long-running server (Railway, Render, PM2, Docker): this pattern works fine.
// ---------------------------------------------------------------------------

let started = false;
let cronStartedAt = null;

export async function GET() {
  try {
    // Start cron only once per process lifetime.
    // On serverless this is effectively a no-op (process dies after response).
    if (!started) {
      startChatbotSyncCron();
      started = true;
      cronStartedAt = new Date();
    }

    // FIX: fetchLimbuBotAdminUsers now has a 60s module-level cache, so this
    // call does NOT hit the LimbuBot API if the cron ran in the past minute.
    const { total, users } = await fetchLimbuBotAdminUsers();

    const chatbotUsers = (users || []).map((user, index) => {
      const rawId = String(user.user_id || "");
      const phone = rawId.replace(/^wa_91/, "").replace(/\D/g, "");
      return {
        serial: index + 1,
        whatsappUserId: rawId,
        // FIX: guard against non-10-digit results from non-Indian numbers
        phone: phone.length === 10 ? phone : "",
        rawPhone: phone || null,
        messageCount: Number(user.message_count) || 0,
        lastActive: user.last_active || "",
        lastMessage: user.last_message
          ? String(user.last_message).slice(0, 120)
          : "",
      };
    });

    return NextResponse.json({
      success: true,
      cron: {
        // FIX: surface the serverless caveat so it's obvious in the response
        status: started ? "registered" : "stopped",
        warning:
          process.env.VERCEL || process.env.NETLIFY
            ? "node-cron does not fire in serverless environments. Use platform cron (vercel.json) instead."
            : null,
        startedAt: cronStartedAt,
        schedule: "Every 10 minutes",
      },
      chatbotUsersSummary: {
        totalUsers: total,
        showing: chatbotUsers.length,
        // FIX: surface how many are non-Indian (could not be linked)
        nonIndianSkipped: chatbotUsers.filter((u) => u.rawPhone && !u.phone)
          .length,
      },
      users: chatbotUsers,
    });
  } catch (error) {
    const isTimeout = error.name === "TimeoutError" || error.name === "AbortError";
    console.error("❌ Chatbot API Error:", error);

    return NextResponse.json(
      {
        success: false,
        // FIX: distinguish timeout from other errors so it's actionable
        message: isTimeout
          ? "LimbuBot API timed out (>10s). Check if the service is reachable."
          : "Failed to fetch chatbot users",
        error: error.message,
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST handler — dedicated sync trigger (use this from Vercel Cron or manually)
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    const { syncChatbotUsersToApp } = await import("@/lib/limbuBotUserSync");
    const result = await syncChatbotUsersToApp({
      minMessageCount: 1,
      maxToInsert: 500,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const isTimeout = error.name === "TimeoutError" || error.name === "AbortError";
    console.error("❌ Chatbot Sync POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: isTimeout
          ? "LimbuBot API timed out (>10s)."
          : "Sync failed",
        error: error.message,
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}