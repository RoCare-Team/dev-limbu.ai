import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import User from "@/models/User";
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import { deductFromWalletAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";
import { getBaseUrl } from "@/utils/urlHelper";
import { createRunLogger } from "@/lib/automationRunLogger";

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

async function getFreshAccessToken(refreshToken) {
  log("🔄 Refreshing access token");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    log("❌ Token refresh failed", data);
    throw new Error(data.error_description || "Token refresh failed");
  }
  log("✅ Access token refreshed");
  return data.access_token;
}

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
    const BATCH_SIZE = 25;
    const candidates = await Post.find({
      status: "scheduled",
      scheduledDate: { $lte: now },
    })
      .sort({ scheduledDate: 1 })
      .limit(BATCH_SIZE)
      .select("_id")
      .lean();

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
      const post = await Post.findOneAndUpdate(
        { _id: candidate._id, status: "scheduled" },
        { status: "processing" },
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
      let successCount = 0;
      let failedCount = 0;
      const platformsPosted = new Set();

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
        const refreshToken = post.refreshToken;
        if (!refreshToken) {
          log("❌ No refresh token on post document:", postId);
          slog.fail("publish:gmb", "no Google refreshToken stored on scheduled post — re-save user-settings");
          post.whenPosted = markWhenFailed(
            post.whenPosted,
            "gmb",
            "No Google refresh token on scheduled post.",
          );
          post.markModified("whenPosted");
          failed = true;
          failedCount++;
        } else {
          try {
            log(
              "🔑 Using stored refreshToken from post document to get a fresh access token.",
            );
            const accessToken = await getFreshAccessToken(refreshToken);
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
                const payload = {
                  postId: post._id.toString(), // ✅ added
                  userId: post.userId, // ✅ added
                  account: loc.accountId,
                  locationData: [
                    {
                      locationId: loc.locationId.replace(/^locations\//, ""), // ✅ add karo
                      city: loc.locationId.replace(/^locations\//, ""),
                      cityName: loc.locality || loc.city || "",
                      bookUrl:
                        !isVideoSelection && gmbMeta.ctaType === "call_now"
                          ? loc.primaryPhone || ""
                          : gmbMeta.customUrl || loc.websiteUrl || "",
                      account: loc.accountId,
                    },
                  ],
                  output: isVideoSelection ? "" : post.aiOutput,
                  video_url: isVideoSelection
                    ? post.videoOutput || post.aiOutput || ""
                    : "",
                  description: post.gmbDescription || post.description || "",
                  accessToken,
                  checkmark: ["post", "photo", "both", "video"].includes(
                    post.checkmark,
                  )
                    ? post.checkmark
                    : "both",
                  post_type: isVideoSelection
                    ? "standard"
                    : gmbMeta.postType || "standard",
                  cta: isVideoSelection
                    ? "learn_more"
                    : gmbMeta.ctaType || "book",
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

                // ✅ Use /api/gmb/publish directly
                const result = await fetchWithTimeout(
                  fetch(`${baseUri}/api/gmb/publish`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  }).then(async (res) => {
                    const text = await res.text();
                    const data = text ? JSON.parse(text) : {};
                    return {
                      ok: res.ok && data?.ok !== false,
                      data: data?.data ?? data,
                    };
                  }),
                  20000,
                );

                // ✅ Proper success check
                const gmbSucceeded =
                  result?.data?.succeeded ?? result?.data?.success?.length ?? 0;
                const gmbFailed = result?.data?.fail ?? [];

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
              }
            }
            post.markModified("locations");
            const gmbOk = post.locations.filter((l) => l.isPosted).length;
            const gmbErr = post.locations.find((l) => l.error)?.error;
            if (gmbOk > 0 && !gmbErr)
              slog.pass("publish:gmb", `posted to ${gmbOk}/${post.locations.length} location(s)`);
            else
              slog.fail("publish:gmb", `posted ${gmbOk}/${post.locations.length} location(s)`, gmbErr);
          } catch (err) {
            log("❌ GMB Critical Error:", err.message);
            slog.fail("publish:gmb", "GMB critical error (token refresh / network)", err);
            post.whenPosted = markWhenFailed(
              post.whenPosted,
              "gmb",
              err.message || "GMB critical error",
            );
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

      await post.save();
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
