import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SocialAutomation from "@/models/SocialAutomation";
import { classifyComment, draftReply } from "@/lib/social/socialAi";

/**
 * POST /api/social/automation/preview { userId, kind: "comment"|"dm"|"moderation", text, tone?, blockedWords?, useAi? }
 * Try the automation on a sample message without posting anything.
 */
export async function POST(req) {
  try {
    const { userId, kind, text, tone, blockedWords, useAi } = await req.json();
    const sample = String(text || "").trim().slice(0, 1000);
    if (!userId || !sample) return NextResponse.json({ success: false, error: "Type a sample message first." }, { status: 400 });

    if (kind === "moderation") {
      const verdict = await classifyComment(sample, { blockedWords: Array.isArray(blockedWords) ? blockedWords : [], useAi: useAi !== false });
      return NextResponse.json({ success: true, ...verdict });
    }

    await dbConnect();
    const s = await SocialAutomation.findOne({ userId }).select("businessName businessInfo").lean();
    const reply = await draftReply(sample, {
      kind: kind === "dm" ? "dm" : "comment",
      tone,
      business: s?.businessInfo || "",
      businessName: s?.businessName || "",
    });
    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error("social automation preview:", err);
    return NextResponse.json({ success: false, error: "Could not create a preview." }, { status: 500 });
  }
}
