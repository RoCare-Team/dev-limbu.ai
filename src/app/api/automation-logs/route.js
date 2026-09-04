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
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import AutomationLog from "@/models/AutomationLog";
import Post from "@/models/PostStatus";
import User from "@/models/User";

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
    // Multi-location post me sabse zaroori sawaal — "kaunsi location baaki hai".
    // Ye live Post document se aata hai (GET handler me attach hota hai).
    if (Number(d.gmbTotal) > 0) {
      const posted = Number(d.gmbPosted) || 0;
      const total = Number(d.gmbTotal);
      lines.push(`   ▶ locations: ${posted}/${total} posted${posted < total ? ` — ${total - posted} PENDING` : " — all done"}`);
      for (const l of d.pendingLocations || []) {
        const att = l.attempts > 0 ? ` [${l.attempts}x]` : "";
        const label = [l.name, l.locality].filter(Boolean).join(" · ") || l.locationId;
        lines.push(`       ✗ ${label}${att} — ${l.error || "not attempted"}`);
      }
    }
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
    const source = searchParams.get("source")?.trim();       // automation | manual
    const q = searchParams.get("q")?.trim();                 // free-text on userId
    if (userId) query.userId = userId;
    if (runId) query.runId = runId;
    if (postId) query.postId = postId;
    if (phase) query.phase = phase;
    if (outcome) query.outcome = outcome;
    if (source === "automation" || source === "manual") query.source = source;
    if (q) query.userId = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 50));

    const docs = await AutomationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // ── Live per-location status ────────────────────────────────────────────
    // "Kis location par post gaya, kis par nahi" ka JAWAB Post document me hai
    // (publish-scheduled har location ke baad wahin likhta hai), log me nahi.
    //
    // Log ka apna snapshot do wajah se kaafi nahi:
    //   1. Purane logs me `pendingLocations` hai hi nahi (field naya hai) —
    //      yaani puraani history par kuch dikhta hi nahi.
    //   2. Snapshot us run ke waqt ka hai. Baad me auto-retry ne bache hue
    //      locations post kar diye ho to log purana sach dikhata rahega.
    //
    // Isliye yahan har log ke `postId` se LIVE Post padh kar breakdown attach
    // karte hain — ek hi batched query me, sab logs ke liye.
    const postIds = [...new Set(docs.map((d) => d.postId).filter(Boolean))];
    if (postIds.length) {
      const validIds = postIds.filter((id) => mongoose.isValidObjectId(id));
      const livePosts = validIds.length
        ? await Post.find({ _id: { $in: validIds } })
            .select("_id status locations publishAttempts")
            .lean()
        : [];
      const byPostId = new Map(livePosts.map((p) => [String(p._id), p]));

      for (const d of docs) {
        const p = byPostId.get(String(d.postId || ""));
        const locs = Array.isArray(p?.locations) ? p.locations : null;
        if (!locs || !locs.length) continue;

        d.gmbTotal = locs.length;
        d.gmbPosted = locs.filter((l) => l.isPosted).length;
        d.postStatus = p.status || "";
        d.publishAttempts = p.publishAttempts || 0;
        d.pendingLocations = locs
          .filter((l) => !l.isPosted)
          .slice(0, 50)
          .map((l) => ({
            locationId: l.locationId || "",
            name: l.name || "",
            locality: l.locality || l.city || "",
            isPosted: false,
            attempts: l.attempts || 0,
            error: l.error || "",
            postedAt: null,
          }));
      }
    }

    // Attach the assigned account manager for each log's user, so the UI can
    // group logs manager-wise (log itself only stores userId).
    const userIds = [...new Set(docs.map((d) => d.userId).filter(Boolean))];
    if (userIds.length) {
      const users = await User.find({ userId: { $in: userIds } })
        .select("userId fullName accountManager accountManagerName")
        .lean();
      const byUserId = new Map(users.map((u) => [u.userId, u]));
      for (const d of docs) {
        const u = byUserId.get(d.userId);
        d.accountManagerName = u?.accountManagerName || "";
        d.accountManagerId = u?.accountManager ? String(u.accountManager) : "";
        if (!d.userFullName) d.userFullName = u?.fullName || "";
      }
    }

    // Manager filter (applied after the join — the log doc has no manager field)
    const manager = searchParams.get("manager")?.trim();
    let result = docs;
    if (manager) {
      result = manager === "unassigned"
        ? docs.filter((d) => !d.accountManagerName)
        : docs.filter((d) => d.accountManagerName === manager);
    }

    if (searchParams.get("format") === "text") {
      return new Response(toText(result) || "No automation logs found.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Quick rollup so you can eyeball health at a glance.
    // Fail kis stage pe hua — phase se nahi pata chalta, kyunki `publish` phase
    // ke andar hi content generation bhi hota hai. Failed step ke naam se:
    //   content:* / queue:generate → generate,  publish:* / done:partial → publish,
    //   baaki (config/token/db/notify) → other.
    const GEN_RE = /^(content:|queue:generate|image:|caption:)/i;
    const PUB_RE = /^(publish:|done:(partial|failed))/i;
    const failTypeOf = (d) => {
      if (d.outcome !== "failed") return null;
      const names = (d.steps || []).filter((s) => s.status === "fail").map((s) => s.name || "");
      if (names.some((n) => GEN_RE.test(n))) return "failGenerate";
      if (names.some((n) => PUB_RE.test(n))) return "failPublish";
      if (names.length) return "failOther";
      return d.phase === "fill-queue" ? "failGenerate" : "failPublish";
    };
    const blank = () => ({ total: 0, success: 0, failed: 0, skipped: 0, unknown: 0, failPublish: 0, failGenerate: 0, failOther: 0 });
    const summary = { ...blank(), total: result.length };
    const bySource = { automation: blank(), manual: blank() };
    const byManager = {};
    for (const d of result) {
      summary[d.outcome] = (summary[d.outcome] || 0) + 1;
      const failType = failTypeOf(d);
      if (failType) summary[failType] += 1;
      const s = bySource[d.source] || bySource.automation;
      s.total++;
      s[d.outcome] = (s[d.outcome] || 0) + 1;
      if (failType) s[failType] += 1;

      const mgr = d.accountManagerName || "Unassigned";
      const m = (byManager[mgr] ||= blank());
      m.total++;
      m[d.outcome] = (m[d.outcome] || 0) + 1;
      if (failType) m[failType] += 1;
    }

    return NextResponse.json({
      success: true,
      summary,
      bySource,
      byManager,
      filters: { userId, runId, postId, phase, outcome, source, q, manager, limit },
      logs: result,
    });
  } catch (error) {
    console.error("GET /api/automation-logs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
