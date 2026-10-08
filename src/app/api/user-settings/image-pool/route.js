import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AutomationPlan from "@/models/AutomationPlan";
import User from "@/models/User";
import { uploadToS3 } from "@/utils/s3Config";
import { ASSET_SLOTS } from "@/lib/automationPlanContentGeneration";

/**
 * The daily image pool, managed straight from /user-settings.
 *
 * Images live on S3 and the plan stores only URLs — a pool of base64 blobs
 * would bloat every plan document the crons read on each run.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// Enough variety for a month of posting without the picker becoming a scroll.
const MAX_PER_SLOT = 30;

function badSlot(slot) {
  return !ASSET_SLOTS.includes(slot);
}

/** The user's live plan — the one the crons actually read. */
async function findPlan(userId) {
  return AutomationPlan.findOne({ userId, active: true }).sort({ updatedAt: -1 });
}

/**
 * Pools live on the automation plan, but a user can land here before they have
 * ever pressed "Save settings". Rather than refusing, start the plan for them:
 * `automationEnabled: false` means no cron will act on it (they all require
 * active AND automationEnabled), so nothing posts until the user sets it up.
 */
async function findOrCreatePlan(userId) {
  const existing = await findPlan(userId);
  if (existing) return existing;

  const user = await User.findOne({ userId }).select("_id").lean();
  if (!user) return null;

  return AutomationPlan.create({
    userId,
    userRef: user._id,
    active: true,
    automationEnabled: false,
    imageConfig: { pools: {} },
  });
}

// -----------------------------
// POST — add one image to a slot's pool (multipart: userId, slot, file)
// -----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const form = await req.formData();

    const userId = String(form.get("userId") || "").trim();
    const slot = String(form.get("slot") || "").trim();
    const file = form.get("file");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });
    }
    if (badSlot(slot)) {
      return NextResponse.json(
        { success: false, error: `slot must be one of: ${ASSET_SLOTS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!file || typeof file !== "object" || !file.size) {
      return NextResponse.json({ success: false, error: "An image file is required." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Image must be PNG, JPG or WEBP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Image must be under 5 MB." }, { status: 400 });
    }

    const plan = await findOrCreatePlan(userId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const current = plan.imageConfig?.pools?.[slot] || [];
    if (current.length >= MAX_PER_SLOT) {
      return NextResponse.json(
        { success: false, error: `This slot already holds ${MAX_PER_SLOT} images — remove one first.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name?.split(".").pop() || "png").toLowerCase();
    // uploadToS3 answers with { success, url, key } — not a bare string.
    const upload = await uploadToS3(
      buffer,
      `pool-${slot}-${Date.now()}.${ext}`,
      file.type,
      `automation-pools/${userId}`
    );
    const url = upload?.url;

    if (!upload?.success || !url) {
      return NextResponse.json(
        { success: false, error: upload?.error || "Upload failed." },
        { status: 502 }
      );
    }

    // $addToSet, not $push: re-uploading the same file must not make it come up
    // twice as often in the rotation.
    await AutomationPlan.updateOne(
      { _id: plan._id },
      { $addToSet: { [`imageConfig.pools.${slot}`]: url } }
    );

    const updated = await AutomationPlan.findById(plan._id).select("imageConfig.pools").lean();
    return NextResponse.json({
      success: true,
      url,
      pool: updated?.imageConfig?.pools?.[slot] || [],
    });
  } catch (error) {
    console.error("IMAGE POOL UPLOAD ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}

// -----------------------------
// GET — every pool for this user
// -----------------------------
export async function GET(req) {
  try {
    await dbConnect();
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });
    }

    const plan = await findPlan(userId);
    const pools = plan?.imageConfig?.pools || {};
    return NextResponse.json({
      success: true,
      pools: Object.fromEntries(ASSET_SLOTS.map((s) => [s, pools[s] || []])),
    });
  } catch (error) {
    console.error("IMAGE POOL LIST ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// -----------------------------
// DELETE — drop one image from a slot (?userId=&slot=&url=)
// The file stays on S3: older posts already published may still point at it.
// -----------------------------
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const slot = searchParams.get("slot");
    const url = searchParams.get("url");

    if (!userId || badSlot(slot) || !url) {
      return NextResponse.json(
        { success: false, error: "userId, a valid slot and url are required." },
        { status: 400 }
      );
    }

    const plan = await findPlan(userId);
    if (!plan) {
      return NextResponse.json({ success: false, error: "No automation plan found." }, { status: 404 });
    }

    await AutomationPlan.updateOne(
      { _id: plan._id },
      { $pull: { [`imageConfig.pools.${slot}`]: url } }
    );

    const updated = await AutomationPlan.findById(plan._id).select("imageConfig.pools").lean();
    return NextResponse.json({
      success: true,
      pool: updated?.imageConfig?.pools?.[slot] || [],
    });
  } catch (error) {
    console.error("IMAGE POOL DELETE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
