import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SocialAutomationLog from "@/models/SocialAutomationLog";
import { automationAccounts, unhideComment } from "@/lib/social/automationEngine";

/** POST /api/social/automation/unhide { userId, logId } — show a hidden comment again. */
export async function POST(req) {
  try {
    const { userId, logId } = await req.json();
    if (!userId || !logId) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    await dbConnect();
    const entry = await SocialAutomationLog.findOne({ _id: logId, userId, kind: "hidden" });
    if (!entry) return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
    const acc = (await automationAccounts(userId)).find((a) => a.platform === entry.platform && a.id === entry.pageId);
    if (!acc) return NextResponse.json({ success: false, error: "That account is no longer connected." }, { status: 400 });
    await unhideComment(acc, entry.objectId);
    entry.restored = true;
    await entry.save();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("social unhide:", err);
    return NextResponse.json({ success: false, error: err.message || "Could not unhide the comment." }, { status: 500 });
  }
}
