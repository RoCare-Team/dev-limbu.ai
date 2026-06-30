/**
 * GET /api/automation-logs
 *
 * Read the step-by-step automation logs written by the crons. Use this to see
 * exactly which step (code region) failed and the real error — without opening
 * the DB.
 *
 * Query params (all optional):
 *   userId   — only this user's logs (e.g. USR_123)
 *   runId    — one specific cron run
 *   postId   — logs for one generated post
 *   phase    — publish | fill-queue | publish-scheduled
 *   outcome  — success | skipped | failed | unknown
 *   limit    — max docs (default 50, max 200)
 *   format   — "text" for a human-readable trail; default JSON
 *
 * Examples:
 *   /api/automation-logs?userId=USR_123&limit=20
 *   /api/automation-logs?outcome=failed&format=text
 *   /api/automation-logs?runId=2026-06-30T11:00:00.000Z-ab12cd
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AutomationLog from "@/models/AutomationLog";

export const dynamic = "force-dynamic";

const STATUS_ICON = {
  pass: "✅",
  success: "🎯",
  fail: "❌",
  skip: "⏭️",
  info: "•",
};

function toText(docs) {
  const lines = [];
  for (const d of docs) {
    const head = `${d.outcome === "failed" ? "❌" : d.outcome === "success" ? "✅" : d.outcome === "skipped" ? "⏭️" : "•"} [${d.phase}] ${new Date(d.createdAt).toISOString()} user=${d.userId || "-"} post=${d.postId || "-"} → ${d.outcome.toUpperCase()}`;
    lines.push(head);
    if (d.trigger) lines.push(`   trigger: ${d.trigger}`);
    for (const s of d.steps || []) {
      const icon = STATUS_ICON[s.status] || "•";
      let line = `   ${icon} ${s.name}`;
      if (s.message) line += ` — ${s.message}`;
      if (s.error) line += `  ⟪ERROR: ${s.error}⟫`;
      lines.push(line);
    }
    if (d.error) lines.push(`   ▶ reason: ${d.error}`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const query = {};
    const userId = searchParams.get("userId")?.trim();
    const runId = searchParams.get("runId")?.trim();
    const postId = searchParams.get("postId")?.trim();
    const phase = searchParams.get("phase")?.trim();
    const outcome = searchParams.get("outcome")?.trim();
    if (userId) query.userId = userId;
    if (runId) query.runId = runId;
    if (postId) query.postId = postId;
    if (phase) query.phase = phase;
    if (outcome) query.outcome = outcome;

    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 50));

    const docs = await AutomationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (searchParams.get("format") === "text") {
      return new Response(toText(docs) || "No automation logs found.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Quick rollup so you can eyeball health at a glance.
    const summary = { total: docs.length, success: 0, failed: 0, skipped: 0, unknown: 0 };
    for (const d of docs) summary[d.outcome] = (summary[d.outcome] || 0) + 1;

    return NextResponse.json({
      success: true,
      summary,
      filters: { userId, runId, postId, phase, outcome, limit },
      logs: docs,
    });
  } catch (error) {
    console.error("GET /api/automation-logs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
