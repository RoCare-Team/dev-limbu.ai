import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import User from "@/models/User";
import AutomationPlan from "@/models/AutomationPlan";
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import { deductFromWalletAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";
import { getBaseUrl } from "@/utils/urlHelper";
import { resolveGmbAccessToken } from "@/lib/gmbSession";
import {
  warmImageUrl,
  isGalleryOnlyFailure,
  isRetryableGmbFailure,
  sleep,
} from "@/lib/gmbMedia";
import { sanitizeGmbDescription, resolveGmbCta, resolveDefaultGmbCta, sanitizePhone } from "@/lib/gmbPostSanitize";
import { createRunLogger } from "@/lib/automationRunLogger";
import { logPublish } from "@/lib/automationFileLogger";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

let debugLogs = [];
const log = (...args) => {
  const formatted = args.map((a) => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === "object" && a !== null) return JSON.stringify(a, null, 2);
    return a;
  });
  try {
    console.log(...formatted);
  } catch {}
  debugLogs.push(formatted.join(" "));
};

const DEFAULT_WHEN_POSTED = [
  { platform: "gmb", posted: false, postedDate: null, postId: "", error: "" },
  {
    platform: "facebook",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "instagram",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "pinterest",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "linkedin",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "youtube",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
];

const PLATFORM_ALIASES = {
  gmb: "gmb",
  fb: "facebook",
  facebook: "facebook",
  ig: "instagram",
  instagram: "instagram",
  pi: "pinterest",
  pinterest: "pinterest",
  li: "linkedin",
  linkedin: "linkedin",
  yt: "youtube",
  youtube: "youtube",
};

const normalizePlatform = (platform) => PLATFORM_ALIASES[platform] || platform;

const markWhenPosted = (currentWhenPosted, platform, postId = "") => {
  const map = new Map(
    DEFAULT_WHEN_POSTED.map((entry) => [entry.platform, { ...entry }]),
  );
  if (Array.isArray(currentWhenPosted)) {
    currentWhenPosted.forEach((entry) => {
      const rawEntry = entry?.toObject ? entry.toObject() : entry;
      const key = normalizePlatform(rawEntry?.platform);
      if (key && map.has(key))
        map.set(key, { ...map.get(key), ...rawEntry, platform: key });
    });
  } else if (currentWhenPosted && typeof currentWhenPosted === "object") {
    Object.entries(currentWhenPosted).forEach(([key, value]) => {
      const platformKey = normalizePlatform(key);
      if (!platformKey || !map.has(platformKey)) return;
      const existing = map.get(platformKey);
      if (typeof value === "object" && value !== null) {
        map.set(platformKey, { ...existing, ...value, platform: platformKey });
      } else if (value === true || value === "posted" || value === "true") {
        map.set(platformKey, {
          ...existing,
          posted: true,
          postedDate: existing.postedDate || new Date(),
        });
      }
    });
  }
  const key = normalizePlatform(platform);
  const existing = map.get(key) || {
    platform: key,
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  };
  map.set(key, {
    ...existing,
    platform: key,
    posted: true,
    postedDate: new Date(),
    postId: postId || existing.postId || "",
    error: "",
  });
  return Array.from(map.values());
};

const markWhenFailed = (currentWhenPosted, platform, error = "") => {
  const map = new Map(
    DEFAULT_WHEN_POSTED.map((entry) => [entry.platform, { ...entry }]),
  );
  if (Array.isArray(currentWhenPosted)) {
    currentWhenPosted.forEach((entry) => {
      const rawEntry = entry?.toObject ? entry.toObject() : entry;
      const key = normalizePlatform(rawEntry?.platform);
      if (key && map.has(key))
        map.set(key, { ...map.get(key), ...rawEntry, platform: key });
    });
  } else if (currentWhenPosted && typeof currentWhenPosted === "object") {
    Object.entries(currentWhenPosted).forEach(([key, value]) => {
      const platformKey = normalizePlatform(key);
      if (!platformKey || !map.has(platformKey)) return;
      const existing = map.get(platformKey);
      if (typeof value === "object" && value !== null) {
        map.set(platformKey, { ...existing, ...value, platform: platformKey });
      }
    });
  }
  const key = normalizePlatform(platform);
  const existing = map.get(key) || {
    platform: key,
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  };
  map.set(key, {
    ...existing,
    platform: key,
    posted: false,
    postedDate: null,
    error: error || "Failed to publish",
  });
  return Array.from(map.values());
};

const formatGmbDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}-${month}-${year}` : "";
};

// Google token refresh ab `resolveGmbAccessToken` (src/lib/gmbSession.js) karta
// hai — wo har stored refresh token snapshot try karta hai, isliye ek stale
// snapshot se poora post fail nahi hota.

async function fetchWithTimeout(promise, ms = 20000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Request timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function getFreshPageToken(userAccessToken, pageId) {
  const res = await fetch(
    `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`,
  );
  const data = await res.json();
  if (!data.data) throw new Error("Unable to fetch FB pages");
  const page = data.data.find((p) => p.id === pageId);
  if (!page?.access_token)
    throw new Error("Page access token not found or permission missing");
  return page.access_token;
}

async function waitForInstagramVideoContainer(
  creationId,
  accessToken,
  maxMs = 300000,
) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const url = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    url.searchParams.set("fields", "status_code,status");
    url.searchParams.set("access_token", accessToken);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(
        data.status?.error_message ||
          data.error?.message ||
          `Instagram processing failed: ${data.status_code}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Instagram video processing timed out after 5 minutes.");
}

async function postToFacebook(page, log) {
  try {
    const { pageId, pageAccessToken, caption, imageUrl, videoUrl, mediaType } =
      page;
    if (!pageId || !pageAccessToken)
      throw new Error("Missing Page ID or Access Token");
    if (mediaType === "video" && videoUrl) {
      const videoRes = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/videos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: graphApiFormEncode({
            file_url: new URL(videoUrl.trim()).href,
            description: caption || "",
            access_token: pageAccessToken,
          }),
        },
      );
      const videoData = await videoRes.json();
      if (!videoData.id)
        throw new Error(videoData.error?.message || "FB Video publish failed");
      log(`✅ Posted video to FB Page ${pageId}`);
      return { success: true, id: videoData.id };
    }
    let mediaId;
    if (imageUrl) {
      const photoRes = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            published: false,
            access_token: pageAccessToken,
          }),
        },
      );
      const photoData = await photoRes.json();
      if (!photoData.id)
        throw new Error(photoData.error?.message || "FB Photo upload failed");
      mediaId = photoData.id;
    }
    const payload = { message: caption || "", access_token: pageAccessToken };
    if (mediaId) payload.attached_media = [{ media_fbid: mediaId }];
    const feedRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const feedData = await feedRes.json();
    if (!feedData.id)
      throw new Error(feedData.error?.message || "FB Feed publish failed");
    log(`✅ Posted to FB Page ${pageId}`);
    return { success: true, id: feedData.id };
  } catch (err) {
    log(`❌ FB Post Error:`, err.message);
    return { success: false, error: err.message };
  }
}

async function postToInstagram(account, log) {
  try {
    const { igUserId, accessToken, caption, imageUrl, videoUrl, mediaType } =
      account;
    const mediaUrlValue = mediaType === "video" ? videoUrl : imageUrl;
    if (!igUserId || !accessToken || !mediaUrlValue)
      throw new Error("Missing IG details");
    const payload =
      mediaType === "video"
        ? {
            video_url: videoUrl.trim(),
            caption: caption || "",
            media_type: "REELS",
            share_to_feed: true,
            access_token: accessToken,
          }
        : {
            image_url: imageUrl,
            caption: caption || "",
            access_token: accessToken,
          };
    const mediaRes = await fetch(
      `https://graph.facebook.com/v24.0/${igUserId}/media`,
      {
        method: "POST",
        headers:
          mediaType === "video"
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : { "Content-Type": "application/json" },
        body:
          mediaType === "video"
            ? graphApiFormEncode(payload)
            : JSON.stringify(payload),
      },
    );
    const mediaData = await mediaRes.json();
    if (!mediaData.id)
      throw new Error(mediaData.error?.message || "IG Media creation failed");
    if (mediaType === "video") {
      await waitForInstagramVideoContainer(mediaData.id, accessToken);
    } else {
      await new Promise((r) => setTimeout(r, 5000));
    }
    const publishRes = await fetch(
      `https://graph.facebook.com/v24.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: accessToken,
        }),
      },
    );
    const publishData = await publishRes.json();
    if (!publishData.id)
      throw new Error(publishData.error?.message || "IG Publish failed");
    log(`✅ Posted to IG Account ${igUserId}`);
    return { success: true, id: publishData.id };
  } catch (err) {
    log(`❌ IG Post Error:`, err.message);
    return { success: false, error: err.message };
  }
}

/* -------------------------------------------------- 
   MAIN CRON FUNCTION
-------------------------------------------------- */
export async function GET(req) {
  debugLogs = [];
  log("🚀 Cron started");

  try {
    await dbConnect();
    log("📦 Mongo connected");

    const now = new Date();
    // Raised from 25 → 60: twicedaily (Premium) queues roughly double the slots
    // of a daily plan, and any overdue backlog (missed/late cron run) needs to
    // clear in one pass — a low cap here is what lets a post generated for
    // "day 5" sit unpublished until the cron finally works through the queue on
    // "day 10". Oldest-due posts are still processed first (sorted ascending).
    const BATCH_SIZE = 60;

    // ?postId=… → sirf us EK post ko publish karo (automation-logs ke "Publish"
    // retry button ke liye). Failed / partial post ko wapas publish karne deta
    // hai, chahe uski scheduledDate window nikal chuki ho.
    const retryPostId = new URL(req.url).searchParams.get("postId")?.trim();
    const RETRYABLE = ["scheduled", "failed", "partial_failed", "processing"];

    // ── Self-healing pickup rules ────────────────────────────────────────────
    // Pehle candidate query sirf `status: "scheduled"` thi. Do silent-miss holes
    // isi wajah se the (dono production me confirmed):
    //
    //  1. STUCK "processing" — cron post ko "processing" mark karta hai aur agar
    //     wo run beech me mar jaye (PM2 max_memory restart, nginx/curl timeout,
    //     deploy) to post hamesha "processing" me pada rehta hai. Koi query use
    //     dobara nahi uthati → us profile ka post kabhi nahi jata. Ab
    //     `processingSince` purana hone par claim wapas le li jaati hai.
    //
    //  2. FAILED / PARTIAL_FAILED kabhi apne aap retry nahi hote the — sirf
    //     dashboard ke manual "Publish now" button se. Ek transient GMB error
    //     (photo gallery, 5xx, "service currently unavailable") = us profile ka
    //     us din ka post gaya. Ab bounded auto-retry: MAX_PUBLISH_ATTEMPTS tak,
    //     exponential backoff ke saath. Per-location loop already `isPosted`
    //     locations ko skip karta hai, isliye retry se duplicate post nahi hota.
    const STALE_PROCESSING_MS =
      Math.max(5, Number(process.env.PUBLISH_STALE_PROCESSING_MIN) || 20) * 60 * 1000;
    const MAX_PUBLISH_ATTEMPTS = Math.max(
      1,
      Number(process.env.PUBLISH_MAX_ATTEMPTS) || 4,
    );
    const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);

    // Reclaim / retry sirf HAAL ke posts ke liye. Iske bina ye change purane
    // stuck aur failed posts (mahine bhar purane) ko ek saath live publish kar
    // deta — client ke GMB par 2 hafte purana content chala jata. Sirf itni hi
    // window jitni me post abhi bhi relevant hai.
    const RETRY_WINDOW_MS =
      Math.max(1, Number(process.env.PUBLISH_RETRY_WINDOW_HOURS) || 36) * 3600 * 1000;
    const retryAfterDate = new Date(now.getTime() - RETRY_WINDOW_MS);

    let candidates;
    if (retryPostId) {
      const one = await Post.findById(retryPostId).select("_id status").lean();
      if (!one) {
        return NextResponse.json(
          { success: false, error: "Post not found", postId: retryPostId },
          { status: 404 },
        );
      }
      if (!RETRYABLE.includes(one.status)) {
        return NextResponse.json(
          { success: false, error: `Post status "${one.status}" is not retryable`, postId: retryPostId },
          { status: 409 },
        );
      }
      candidates = [{ _id: one._id, status: one.status }];
      log(`🔁 Manual retry for single post ${retryPostId} (status=${one.status})`);
    } else {
      candidates = await Post.find({
        $or: [
          // Normal path — publish time aa gaya.
          { status: "scheduled", scheduledDate: { $lte: now } },
          // Reclaim: pichla run is post par marr gaya tha.
          {
            status: "processing",
            scheduledDate: { $gte: retryAfterDate, $lte: now },
            $or: [
              { processingSince: { $lte: staleBefore } },
              // Purane documents jinme `processingSince` field hi nahi thi.
              { processingSince: { $in: [null, undefined] }, updatedAt: { $lte: staleBefore } },
            ],
          },
          // Bounded auto-retry for a failed / partially failed publish.
          {
            status: { $in: ["failed", "partial_failed"] },
            scheduledDate: { $gte: retryAfterDate, $lte: now },
            publishAttempts: { $lt: MAX_PUBLISH_ATTEMPTS },
            $or: [{ nextRetryAt: { $lte: now } }, { nextRetryAt: { $in: [null, undefined] } }],
          },
        ],
      })
        .sort({ scheduledDate: 1 })
        .limit(BATCH_SIZE)
        .select("_id status processingSince")
        .lean();
    }

    if (!candidates.length) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts due.",
        logs: debugLogs,
      });
    }

    log(
      `Found ${candidates.length} posts to process (Batch Limit: ${BATCH_SIZE}).`,
    );

    const stats = {
      total: candidates.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      posted: 0,
    };

    const run = createRunLogger({ phase: "publish-scheduled", trigger: "cron" });

    for (const candidate of candidates) {
      // Claim atomic hai: filter me WAHI status hai jis wajah se ye post
      // candidate bana tha. Do overlapping cron runs me pehla hi jeetega —
      // doosre ka filter match nahi karega (status ab "processing" ho chuka)
      // aur wo post skip kar dega. Isliye double-publish possible nahi.
      //
      // "processing" ko bhi claim kiya jaa sakta hai, par sirf tab jab wo stale
      // ho — us case me `processingSince` naya set hota hai, to teesra run usi
      // post ko dobara reclaim nahi kar payega.
      const claimFilter = retryPostId
        ? { _id: candidate._id, status: { $in: RETRYABLE } }
        : candidate.status === "processing"
          ? { _id: candidate._id, status: "processing", processingSince: candidate.processingSince ?? null }
          : { _id: candidate._id, status: candidate.status };
      const post = await Post.findOneAndUpdate(
        claimFilter,
        {
          $set: { status: "processing", processingSince: new Date(), nextRetryAt: null },
          $inc: { publishAttempts: 1 },
        },
        { new: true },
      );

      if (!post) {
        log(`- Post ${candidate._id} skipped (locked or status changed).`);
        stats.skipped++;
        continue;
      }

      const postId = post._id.toString();
      const slog = run.plan({
        userId: post.userId,
        planId: post.automationPlanId,
        postId,
        // Automation-queued posts came from an auto plan; everything else here was
        // scheduled manually by the user via the Schedule modal.
        source: post.automationQueued ? "automation" : "manual",
      });
      // Business name + image URL log par set — fail hone par bhi dono dikhein.
      const loc0 = Array.isArray(post.locations) ? post.locations[0] : null;
      slog.setMeta({
        businessName: loc0?.name || loc0?.title || post.businessName || "",
        locality: loc0?.locality || loc0?.city || "",
        keyword: post.keyword || "",
        imageUrl: post.aiOutput || post.imageUrl || "",
        platforms: [
          ...(Array.isArray(post.locations) && post.locations.length ? ["gmb"] : []),
          ...(Array.isArray(post.fbPages) && post.fbPages.length ? ["fb"] : []),
          ...(Array.isArray(post.igPages) && post.igPages.length ? ["ig"] : []),
        ],
      });
      slog.info("post:start", `scheduledDate=${post.scheduledDate?.toISOString?.() || ""}`);
      log(`📝 Processing post ${postId}`);

      const hasGmb = Array.isArray(post.locations) && post.locations.length > 0;
      const hasFb = Array.isArray(post.fbPages) && post.fbPages.length > 0;
      const hasIg = Array.isArray(post.igPages) && post.igPages.length > 0;

      if (!hasGmb && !hasFb && !hasIg) {
        log("⚠ Invalid or empty targets (No GMB, FB, or IG)");
        slog.fail("config:no-targets", "scheduled post has no GMB/FB/IG targets");
        post.status = "failed";
        post.error = "Scheduled post has no targets.";
        await post.save();
        stats.failed++;
        continue;
      }

      const user = await User.findOne({ userId: post.userId });
      if (!user) {
        log("❌ User not found for post " + postId);
        slog.fail("config:user-not-found", `owner user not found (userId=${post.userId})`);
        post.status = "failed";
        post.error = "Owner user not found.";
        await post.save();
        stats.skipped++;
        continue;
      }

      let failed = false;
      // Retry run me pehle se posted targets ko success ginna zaroori hai.
      // Warna: 125 me se 120 locations pichli baar chale gaye, retry me sirf 5
      // bache — agar wo 5 bhi na chale to successCount=0 aata aur post "failed"
      // mark hota, jabki 120 locations par post LIVE hai. Ab wo "partial_failed"
      // rehta hai aur baaki 5 agli attempt me pick hote hain.
      const alreadyPostedTargets =
        (Array.isArray(post.locations) ? post.locations.filter((l) => l.isPosted).length : 0) +
        (Array.isArray(post.fbPages) ? post.fbPages.filter((p) => p.isPosted).length : 0) +
        (Array.isArray(post.igPages) ? post.igPages.filter((a) => a.isPosted).length : 0);
      let successCount = alreadyPostedTargets;
      let failedCount = 0;
      const platformsPosted = new Set();
      if (alreadyPostedTargets > 0) {
        log(`↻ Retry attempt ${post.publishAttempts} — ${alreadyPostedTargets} target(s) already posted, sirf baaki targets try honge`);
      }

      // ── FACEBOOK ────────────────────────────────────────
      if (hasFb) {
        log(`Processing ${post.fbPages.length} Facebook pages`);
        for (let i = 0; i < post.fbPages.length; i++) {
          const page = post.fbPages[i];
          if (page.isPosted) continue;
          let tokenToUse = page.pageAccessToken;
          try {
            const freshPage = await FacebookPage.findOne({
              pageId: page.pageId,
              userId: post.userId,
            });
            if (freshPage) {
              if (freshPage.userAccessToken) {
                tokenToUse = await getFreshPageToken(
                  freshPage.userAccessToken,
                  page.pageId,
                );
                log(
                  `🔄 Generated fresh FB page token via User Token for ${page.pageId}`,
                );
              } else if (freshPage.pageAccessToken) {
                tokenToUse = freshPage.pageAccessToken;
                log(`🔄 Using stored fresh FB token for page ${page.pageId}`);
              }
            }
          } catch (e) {
            log(`⚠️ Failed to fetch fresh FB token: ${e.message}`);
          }

          const pagePayload = page.toObject ? page.toObject() : { ...page };
          pagePayload.pageAccessToken = tokenToUse;
          // Prefer the Facebook-specific caption the cron generated over the
          // queue-time placeholder so FB gets its OWN text (not the GMB caption).
          pagePayload.caption =
            post.fbDescription || pagePayload.caption || post.description || "";
          // Automation-queued fbPages (from user-settings) carry only caption —
          // no media. Fall back to the post-level image/video the fill-queue cron
          // generated so the page posts WITH an image instead of text-only.
          pagePayload.imageUrl = pagePayload.imageUrl || post.aiOutput || "";
          pagePayload.videoUrl = pagePayload.videoUrl || post.videoOutput || "";
          pagePayload.mediaType =
            pagePayload.mediaType ||
            (post.checkmark === "video" && post.videoOutput ? "video" : "image");
          const result = await postToFacebook(pagePayload, log);
          if (result.success) {
            page.isPosted = true;
            page.postedAt = new Date();
            page.postId = result.id;
            page.error = null;
            post.whenPosted = markWhenPosted(
              post.whenPosted,
              "facebook",
              result.id,
            );
            post.postedPlatform = Array.from(
              new Set([
                ...(post.postedPlatform
                  ? post.postedPlatform
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean)
                  : []),
                "facebook",
              ]),
            ).join(",");
            platformsPosted.add("Facebook");
            post.markModified("whenPosted");
            if (!post.mediaStatus) post.mediaStatus = {};
            post.mediaStatus[
              pagePayload.mediaType === "video" ? "video" : "image"
            ] = "posted";
            post.markModified("mediaStatus");
            successCount++;
          } else {
            page.error = result.error;
            post.whenPosted = markWhenFailed(
              post.whenPosted,
              "facebook",
              result.error,
            );
            post.markModified("whenPosted");
            failed = true;
            failedCount++;
          }
        }
        post.markModified("fbPages");
        const fbOk = post.fbPages.filter((p) => p.isPosted).length;
        const fbErr = post.fbPages.find((p) => p.error)?.error;
        if (fbOk > 0 && !fbErr)
          slog.pass("publish:fb", `posted to ${fbOk}/${post.fbPages.length} page(s)`);
        else
          slog.fail("publish:fb", `posted ${fbOk}/${post.fbPages.length} page(s)`, fbErr);
      }

      // ── INSTAGRAM ───────────────────────────────────────
      if (hasIg) {
        log(`Processing ${post.igPages.length} Instagram accounts`);
        for (let i = 0; i < post.igPages.length; i++) {
          const account = post.igPages[i];
          if (account.isPosted) continue;
          // Automation-queued igPages store pageAccessToken (not accessToken).
          let tokenToUse = account.accessToken || account.pageAccessToken;
          try {
            const freshIg = await InstagramPage.findOne({
              igId: account.igUserId,
              userId: post.userId,
            });
            if (freshIg?.userAccessToken && freshIg?.pageId) {
              tokenToUse = await getFreshPageToken(
                freshIg.userAccessToken,
                freshIg.pageId,
              );
              log(
                `🔄 Generated fresh IG token via Instagram record for ${freshIg.pageId}`,
              );
            } else if (freshIg?.pageAccessToken) {
              tokenToUse = freshIg.pageAccessToken;
              log(`🔄 Using stored fresh IG token for ${account.igUserId}`);
            }
            if (account.pageId) {
              const freshPage = await FacebookPage.findOne({
                pageId: account.pageId,
                userId: post.userId,
              });
              if (freshPage?.userAccessToken) {
                tokenToUse = await getFreshPageToken(
                  freshPage.userAccessToken,
                  account.pageId,
                );
                log(`🔄 Generated fresh IG (Page) token for ${account.pageId}`);
              }
            }
          } catch (e) {
            log(`⚠️ Failed to refresh IG token: ${e.message}`);
          }

          const accountPayload = account.toObject
            ? account.toObject()
            : { ...account };
          accountPayload.accessToken = tokenToUse;
          // Prefer the Instagram-specific caption the cron generated over the
          // queue-time placeholder so IG gets its OWN text (not the GMB caption).
          accountPayload.caption =
            post.igDescription || accountPayload.caption || post.description || "";
          // Automation-queued igPages use `igId` and carry no media — normalize to
          // what postToInstagram expects (igUserId) and fall back to the
          // post-level image/video generated by the fill-queue cron.
          accountPayload.igUserId = accountPayload.igUserId || accountPayload.igId;
          accountPayload.imageUrl = accountPayload.imageUrl || post.aiOutput || "";
          accountPayload.videoUrl = accountPayload.videoUrl || post.videoOutput || "";
          accountPayload.mediaType =
            accountPayload.mediaType ||
            (post.checkmark === "video" && post.videoOutput ? "video" : "image");
          const result = await postToInstagram(accountPayload, log);
          if (result.success) {
            account.isPosted = true;
            account.postedAt = new Date();
            account.postId = result.id;
            account.error = null;
            post.whenPosted = markWhenPosted(
              post.whenPosted,
              "instagram",
              result.id,
            );
            post.postedPlatform = Array.from(
              new Set([
                ...(post.postedPlatform
                  ? post.postedPlatform
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean)
                  : []),
                "instagram",
              ]),
            ).join(",");
            platformsPosted.add("Instagram");
            post.markModified("whenPosted");
            if (!post.mediaStatus) post.mediaStatus = {};
            post.mediaStatus[
              accountPayload.mediaType === "video" ? "video" : "image"
            ] = "posted";
            post.markModified("mediaStatus");
            successCount++;
          } else {
            account.error = result.error;
            post.whenPosted = markWhenFailed(
              post.whenPosted,
              "instagram",
              result.error,
            );
            post.markModified("whenPosted");
            failed = true;
            failedCount++;
          }
        }
        post.markModified("igPages");
        const igOk = post.igPages.filter((a) => a.isPosted).length;
        const igErr = post.igPages.find((a) => a.error)?.error;
        if (igOk > 0 && !igErr)
          slog.pass("publish:ig", `posted to ${igOk}/${post.igPages.length} account(s)`);
        else
          slog.fail("publish:ig", `posted ${igOk}/${post.igPages.length} account(s)`, igErr);
      }

      // ── GMB ─────────────────────────────────────────────
      if (hasGmb) {
        // Token resolve ab MULTI-SOURCE hai (dekho: src/lib/gmbSession.js).
        // post.refreshToken sirf ek snapshot hai jo queue banate waqt copy hua
        // tha; user ke reconnect karte hi Google use revoke kar deta hai. Pehle
        // yahi akela try hota tha aur post "Reconnect GMB required" bolke fail
        // ho jata — jabki GmbConnection / AutomationPlan par valid token maujood
        // tha. Ab live connection → plan → snapshot, teeno try hote hain.
        {
          try {
            const { accessToken, source } = await resolveGmbAccessToken({
              userId: post.userId,
              extraRefreshTokens: [post.refreshToken],
              log: (m) => log(m),
            });
            log(`🔑 GMB access token resolved from ${source}.`);
            const processedLocIds = new Set();
            const gmbMeta = post.gmbPostMeta || {};
            const isVideoSelection =
              post.checkmark === "video" || post.mediaType === "video";

            for (let i = 0; i < post.locations.length; i++) {
              const loc = post.locations[i];
              if (
                !loc?.locationId ||
                loc.isPosted ||
                processedLocIds.has(loc.locationId)
              )
                continue;

              try {
                // CTA decide karo. User ne choose kiya to wahi; warna DEFAULT
                // call_now — us location ka apna phone. Phone/URL na mile to
                // graceful fallback taaki Google "invalid argument" na de.
                const chosenCta = isVideoSelection ? "learn_more" : gmbMeta.ctaType;
                let safeCta, safeCtaUrl;
                if (!chosenCta) {
                  // Koi CTA nahi chuna → default call_now (phone) / fallback.
                  ({ cta: safeCta, url: safeCtaUrl } = resolveDefaultGmbCta({
                    phone: loc.primaryPhone,
                    website: gmbMeta.customUrl || loc.websiteUrl,
                  }));
                } else if (chosenCta === "call_now") {
                  safeCta = "call_now";
                  safeCtaUrl = sanitizePhone(loc.primaryPhone);
                  // Phone hi nahi to call button ka matlab nahi — fallback.
                  if (!safeCtaUrl) {
                    ({ cta: safeCta, url: safeCtaUrl } = resolveDefaultGmbCta({
                      phone: "", website: gmbMeta.customUrl || loc.websiteUrl,
                    }));
                  }
                } else {
                  ({ cta: safeCta, url: safeCtaUrl } = resolveGmbCta(
                    chosenCta,
                    gmbMeta.customUrl || loc.websiteUrl || "",
                  ));
                }

                const payload = {
                  postId: post._id.toString(), // ✅ added
                  userId: post.userId, // ✅ added
                  account: loc.accountId,
                  locationData: [
                    {
                      locationId: loc.locationId.replace(/^locations\//, ""), // ✅ add karo
                      city: loc.locationId.replace(/^locations\//, ""),
                      cityName: loc.locality || loc.city || "",
                      bookUrl: safeCtaUrl,
                      account: loc.accountId,
                    },
                  ],
                  output: isVideoSelection ? "" : post.aiOutput,
                  video_url: isVideoSelection
                    ? post.videoOutput || post.aiOutput || ""
                    : "",
                  description: sanitizeGmbDescription(post.gmbDescription || post.description || ""),
                  accessToken,
                  checkmark: ["post", "photo", "both", "video"].includes(
                    post.checkmark,
                  )
                    ? post.checkmark
                    : "both",
                  post_type: isVideoSelection
                    ? "standard"
                    : gmbMeta.postType || "standard",
                  cta: safeCta,
                  startDate: isVideoSelection
                    ? ""
                    : formatGmbDate(gmbMeta.startDate),
                  endDate: isVideoSelection
                    ? ""
                    : formatGmbDate(gmbMeta.endDate),
                  tittle: isVideoSelection ? "" : gmbMeta.eventTitle || "",
                  wait_video: false,
                  skipDbUpdate: true,
                };

                console.log("Payload for sedule:", payload);

                const baseUri = getBaseUrl(req);

                console.log("base uri:-", baseUri);

                const mediaUrl = isVideoSelection
                  ? payload.video_url
                  : payload.output;

                // Google photo gallery ke liye image URL KHUD fetch karta hai.
                // Pehle hum warm kar dete hain — warna fresh S3 object par uska
                // fetch race/timeout kar jata hai aur "Photo gallery upload
                // failed" aata hai (yahi is post ke fail hone ki wajah thi).
                if (!isVideoSelection) await warmImageUrl(mediaUrl, log);

                const callPublish = (overrides) =>
                  fetchWithTimeout(
                    fetch(`${baseUri}/api/gmb/publish`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(
                        overrides ? { ...payload, ...overrides } : payload,
                      ),
                    }).then(async (res) => {
                      const text = await res.text();
                      const data = text ? JSON.parse(text) : {};
                      return {
                        ok: res.ok && data?.ok !== false,
                        data: data?.data ?? data,
                      };
                    }),
                    // Photo gallery upload me Google ko 5-6 MB image fetch karni
                    // hoti hai — 20s bahut kam tha (upstream ka apna limit 300s).
                    120000,
                  );

                // ── Per-location retry ────────────────────────────────────────
                // Pehle sirf "Photo gallery upload failed" retry hota tha aur
                // sirf 3 baar. 60-din ke production data me ye SABSE BADI wajah
                // nikli ki "kuch locations par post nahi jata": 1492 locations
                // gallery step par, 26 "Internal error encountered.", 2
                // "service currently unavailable", 1 timeout. Baaki errors ko ek
                // hi koshish milti thi.
                //
                // Ab: har RETRYABLE transient error par backoff ke saath retry,
                // aur aakhri koshish me gallery step chhod kar sirf POST — taaki
                // ek flaky photo-upload us location ka post hi na kha jaye.
                // (Gallery fail hone par upstream kuch bhi publish nahi karta,
                // isliye ye retry duplicate post nahi banate.)
                const MAX_LOC_ATTEMPTS = Math.max(
                  2,
                  Number(process.env.GMB_LOCATION_RETRIES) || 4,
                );
                let result;
                let gmbSucceeded = 0;
                let gmbFailed = [];
                let galleryFallback = false;

                for (let attempt = 1; attempt <= MAX_LOC_ATTEMPTS; attempt++) {
                  result = await callPublish(
                    galleryFallback ? { checkmark: "post" } : undefined,
                  );
                  gmbSucceeded =
                    result?.data?.succeeded ?? result?.data?.success?.length ?? 0;
                  gmbFailed = result?.data?.fail ?? [];

                  if (result?.ok && gmbSucceeded > 0) {
                    if (galleryFallback) {
                      log(
                        `⚠ ${loc.locationId}: post LIVE hai, par photo gallery upload skip karna pada (Google baar-baar fail kar raha tha)`,
                      );
                    }
                    break;
                  }

                  if (!isRetryableGmbFailure(gmbFailed)) {
                    log(
                      `⛔ ${loc.locationId}: permanent error — retry nahi (${String(gmbFailed?.[0]?.error || "").slice(0, 120)})`,
                    );
                    break;
                  }

                  if (attempt === MAX_LOC_ATTEMPTS) {
                    log(
                      `⚠ ${loc.locationId}: ${attempt} koshish ke baad bhi fail — post-level auto-retry par chhoda ja raha hai`,
                    );
                    break;
                  }

                  // Aakhri koshish se pehle: agar problem sirf gallery step ki
                  // hai to bina gallery ke publish karo — post to chala jaye.
                  if (
                    !galleryFallback &&
                    attempt === MAX_LOC_ATTEMPTS - 1 &&
                    !isVideoSelection &&
                    payload.checkmark === "both" &&
                    isGalleryOnlyFailure(gmbFailed)
                  ) {
                    galleryFallback = true;
                    log(
                      `↻ ${loc.locationId}: gallery step baar-baar fail — aakhri koshish checkmark="post" ke saath (photo gallery skip)`,
                    );
                  }

                  const waitMs = 4000 * attempt; // 4s, 8s, 12s — media settle hone do
                  log(
                    `↻ ${loc.locationId}: retry ${attempt + 1}/${MAX_LOC_ATTEMPTS} ${waitMs / 1000}s me — "${String(gmbFailed?.[0]?.error || "unknown").slice(0, 80)}"`,
                  );
                  if (!isVideoSelection) await warmImageUrl(mediaUrl, log);
                  await sleep(waitMs);
                }

                if (!result?.ok || gmbSucceeded === 0) {
                  const errMsg =
                    gmbFailed?.[0]?.error ||
                    result?.data?.error ||
                    "GMB post failed";
                  throw new Error(errMsg);
                }

                // ✅ STEP 1: Post success mark karo — wallet se pehle
                post.locations.forEach((l) => {
                  if (l.locationId === loc.locationId) {
                    l.isPosted = true;
                    l.postedAt = new Date();
                    l.apiResponse = result;
                    // Pichli koshish ka error hata do — warna retry me post ho
                    // chuki location bhi "error" ke saath dikhti rehti hai.
                    l.error = "";
                  }
                });

                post.whenPosted = markWhenPosted(post.whenPosted, "gmb");
                post.postedPlatform = Array.from(
                  new Set([
                    ...(post.postedPlatform
                      ? post.postedPlatform
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean)
                      : []),
                    "gmb",
                  ]),
                ).join(",");
                platformsPosted.add("Google My Business");
                post.markModified("whenPosted");
                if (!post.mediaStatus) post.mediaStatus = {};
                post.mediaStatus[isVideoSelection ? "video" : "image"] =
                  "posted";
                post.markModified("mediaStatus");
                processedLocIds.add(loc.locationId);
                successCount++;

                // ✅ STEP 1b: Progress TURANT DB me likho.
                //
                // Pehle 125 locations ka `isPosted` sirf memory me rehta tha aur
                // `post.save()` sabse aakhir me hota tha. Agar run beech me mar
                // jaye (PM2 restart, timeout, deploy) to publish ho chuke 80
                // locations ka record hi nahi bachta — aur retry unhe DOBARA
                // post kar deta (duplicate). Ab har location ke baad likhte hain,
                // isliye reclaim/retry hamesha wahin se uthata hai jahan chhoda
                // tha. `processingSince` heartbeat ka bhi kaam karta hai taaki ek
                // lamba (100+ location) run galti se "stale" na maana jaye.
                try {
                  await Post.updateOne(
                    { _id: post._id },
                    {
                      $set: {
                        "locations.$[el].isPosted": true,
                        "locations.$[el].postedAt": new Date(),
                        "locations.$[el].error": "",
                        processingSince: new Date(),
                      },
                    },
                    { arrayFilters: [{ "el.locationId": loc.locationId }] },
                  );
                } catch (persistErr) {
                  log(`⚠️ Could not persist location progress: ${persistErr.message}`);
                }

                // ✅ STEP 2: Wallet alag try-catch mein
                try {
                  const walletData = await deductFromWalletAction(user.userId, {
                    amount: 20,
                    type: "deduct",
                    reason: "Post-on-GMB",
                    metadata: {
                      aiPrompt: post.promat || "",
                      logoUsed: !!post.logoUrl,
                      postId: post._id.toString(),
                      locationId: loc.locationId,
                    },
                  });

                  if (walletData?.message === "Wallet debited") {
                    log(`🪙 20 coins deducted | balance: ${walletData.wallet}`);
                  } else if (walletData?.error === "Insufficient balance") {
                    log(`⚠️ Insufficient wallet balance — post still succeeded`);
                  } else {
                    log(`⚠️ Wallet response: ${JSON.stringify(walletData)}`);
                  }
                } catch (walletErr) {
                  log(`⚠️ Wallet error (post still succeeded): ${walletErr.message}`);
                }
              } catch (err) {
                log(
                  `❌ Error posting to location ${loc.locationId}:`,
                  err.message || "Unknown error",
                );
                loc.error = err.message || "Unknown error";
                loc.isPosted = false;
                post.whenPosted = markWhenFailed(
                  post.whenPosted,
                  "gmb",
                  err.message || "Unknown error",
                );
                post.markModified("whenPosted");
                failed = true;
                failedCount++;
                // Heartbeat: 100+ locations wala run 20 min se lamba ho sakta
                // hai. Iske bina doosra cron run ise "stale processing" samajh
                // kar parallel me claim kar leta.
                try {
                  await Post.updateOne(
                    { _id: post._id },
                    { $set: { processingSince: new Date() } },
                  );
                } catch { /* heartbeat best-effort */ }
              }
            }
            post.markModified("locations");
            const gmbOk = post.locations.filter((l) => l.isPosted).length;
            const gmbFailedLocs = post.locations.filter((l) => !l.isPosted).length;
            const gmbErr = post.locations.find((l) => !l.isPosted && l.error)?.error;
            if (gmbFailedLocs === 0)
              slog.pass("publish:gmb", `posted to ${gmbOk}/${post.locations.length} location(s)`);
            else
              slog.fail(
                "publish:gmb",
                `posted ${gmbOk}/${post.locations.length} location(s) — ${gmbFailedLocs} baaki (auto-retry hoga)`,
                gmbErr,
              );
          } catch (err) {
            log("❌ GMB Critical Error:", err.message);

            // Reconnect sirf tab, jab resolveGmbAccessToken ne SAARE stored
            // tokens try karke haar maani ho (wahi connection ko `invalid` bhi
            // mark karta hai — yahan dobara karne ki zaroorat nahi). Transient
            // Google failure par status waisa hi "try again" rehta hai.
            const needsReconnect = err.code === "GMB_RECONNECT_REQUIRED";

            const failReason = needsReconnect
              ? "GMB reconnect required (access revoked). Reconnect Google Business Profile."
              : err.message || "GMB critical error";

            slog.fail("publish:gmb", "GMB critical error (token refresh / network)", err);
            post.whenPosted = markWhenFailed(post.whenPosted, "gmb", failReason);
            post.markModified("whenPosted");
            failed = true;
            failedCount++;
          }
        }
      }

      // ── FINAL STATUS ────────────────────────────────────
      if (!failed && successCount > 0) {
        post.status = "posted";
        post.error = null;
        post.processingSince = null;
        post.nextRetryAt = null;
        stats.posted++;
        slog.success("done", `posted to [${Array.from(platformsPosted).join(", ")}]`);

        try {
          const platforms = Array.from(platformsPosted);
          const businessName =
            post.locations?.[0]?.name || post.locations?.[0]?.city || "";
          const locationName = post.locations?.[0]?.name || "";
          const postUrl = post.locations?.[0]?.websiteUrl || "";
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

          for (const platform of platforms) {
            try {
              const emailResponse = await fetch(
                `${baseUrl}/api/send-post-published-email`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: post.userId,
                    platform,
                    businessName,
                    locationName,
                    postUrl,
                  }),
                },
              );
              const emailResult = await emailResponse.json();
              if (emailResult.success) {
                log(`📧 Post published email sent to user for ${platform}`);
              } else {
                log(
                  `⚠️ Failed to send post published email for ${platform}:`,
                  emailResult.message,
                );
              }
            } catch (emailError) {
              log(
                `⚠️ Error sending email for ${platform}:`,
                emailError.message,
              );
            }
          }
        } catch (emailError) {
          log(`⚠️ Error sending post published email:`, emailError.message);
        }
      } else if (successCount > 0 && failedCount > 0) {
        post.status = "partial_failed";
        post.error = "Some platforms posted successfully, one or more failed.";
        stats.failed++;
        slog.fail("done:partial", `partial — ${successCount} ok, ${failedCount} failed`);
      } else {
        post.status = "failed";
        post.error = "One or more targets failed to post.";
        stats.failed++;
        slog.fail("done:failed", `all targets failed (${failedCount} failed)`);
      }

      // Fail hone par agla auto-retry schedule karo (exponential backoff:
      // ~10m, 30m, 90m). Attempts khatam → post wahin rukta hai aur sirf
      // dashboard ka manual "Publish now" use hota hai.
      if (post.status !== "posted") {
        post.processingSince = null;
        if (post.publishAttempts < MAX_PUBLISH_ATTEMPTS) {
          const backoffMin = 10 * Math.pow(3, Math.max(0, post.publishAttempts - 1));
          post.nextRetryAt = new Date(now.getTime() + backoffMin * 60 * 1000);
          log(
            `↻ Auto-retry #${post.publishAttempts + 1}/${MAX_PUBLISH_ATTEMPTS} scheduled in ~${backoffMin}m (${post.nextRetryAt.toISOString()})`,
          );
        } else {
          post.nextRetryAt = null;
          log(`⛔ Auto-retry exhausted after ${post.publishAttempts} attempts — manual publish needed`);
          slog.fail(
            "retry:exhausted",
            `auto-retry ${post.publishAttempts}/${MAX_PUBLISH_ATTEMPTS} attempts exhausted — dashboard se manual publish karein`,
          );
        }
      }

      await post.save();

      // Advance the automation plan's counters so the dashboard reflects progress.
      //
      // ⚠ postIndex yahan JAAN-BOOJHKAR nahi badhta. Slot cursor ka MAALIK
      // /api/cron/automation-fill-queue hai — wahan post banate waqt hi
      // `$inc: { postIndex: 1 }` hota hai. Yahan dobara badhane se har publish
      // ho chuke post par cursor 2 slot aage kood jata tha, matlab
      // `queueTiming.publishSchedule` ka har DUSRA din kabhi generate hi nahi
      // hota (production me confirmed: publish hone wale plans ka
      // postIndex/postsCreated ≈ 2.0). Yahi "kuch profiles ka post miss ho jata
      // hai" aur "plan aadhe time me khatam ho gaya" dono ki jad thi.
      // postsUsed (published count) aur lastPostDate yahan sahi jagah par hain.
      if (post.status === "posted" && post.automationQueued && post.automationPlanId) {
        try {
          await AutomationPlan.updateOne(
            { _id: post.automationPlanId },
            {
              $inc: { "planDetails.postsUsed": 1 },
              $set: { lastPostDate: new Date() },
            },
          );
        } catch (planErr) {
          log(`⚠️ Failed to update AutomationPlan counters: ${planErr.message}`);
        }
      }

      // Human-readable publish event → logs/automation-posts.log
      logPublish({
        ok: post.status === "posted",
        userId: post.userId,
        postId: post._id,
        status: post.status,
        gmb: hasGmb ? `${post.locations.filter((l) => l.isPosted).length}/${post.locations.length}` : "",
        fb: hasFb ? `${post.fbPages.filter((p) => p.isPosted).length}/${post.fbPages.length}` : "",
        ig: hasIg ? `${post.igPages.filter((a) => a.isPosted).length}/${post.igPages.length}` : "",
        error: post.status === "posted" ? "" : post.error,
      });

      stats.processed++;
    }

    const logSave = await run.flush();

    log("✅ Batch processing complete", stats);
    return NextResponse.json({
      success: true,
      runId: run.runId,
      automationLogsSaved: logSave.saved,
      stats,
      logs: debugLogs,
    });
  } catch (err) {
    log("💥 CRON CRASH", err.stack);
    return NextResponse.json({
      success: false,
      error: err.message,
      logs: debugLogs,
    });
  }
}
