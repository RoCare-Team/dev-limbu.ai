import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import User from "@/models/User";
import FacebookPage from "@/models/FacebookPage";
import { postToGmbAction } from "@/lib/gmb/postToGmb";
import { deductFromWalletAction } from "@/app/actions/postActions";

// Vercel & Next.js Config
// --------------------------------------------------
// Allow up to 5 minutes for execution (Vercel Pro plan limit).
// We aim to finish much faster, but this prevents premature 504s.
export const maxDuration = 300;
// Ensure the route is never cached so cron always sees fresh data.
export const dynamic = "force-dynamic";

/* -------------------------------------------------- 
   DEBUG LOGGER
-------------------------------------------------- */
let debugLogs = [];
const log = (...args) => {
  const formatted = args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === "object" && a !== null) return JSON.stringify(a, null, 2);
    return a;
  });
  try { console.log(...formatted); } catch { }
  debugLogs.push(formatted.join(" "));
};

/* -------------------------------------------------- 
   REFRESH ACCESS TOKEN
-------------------------------------------------- */
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

/* -------------------------------------------------- 
   TIMEOUT HELPER
-------------------------------------------------- */
async function fetchWithTimeout(promise, ms = 20000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/* -------------------------------------------------- 
   GET FRESH PAGE TOKEN (FB/INSTA)
-------------------------------------------------- */
async function getFreshPageToken(userAccessToken, pageId) {
  const res = await fetch(
    `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`
  );
  const data = await res.json();

  if (!data.data) throw new Error("Unable to fetch FB pages");

  const page = data.data.find(p => p.id === pageId);

  if (!page?.access_token) {
    throw new Error("Page access token not found or permission missing");
  }

  return page.access_token;
}

/* -------------------------------------------------- 
   FACEBOOK POST HELPER
-------------------------------------------------- */
async function postToFacebook(page, log) {
  try {
    const { pageId, pageAccessToken, caption, imageUrl } = page;
    if (!pageId || !pageAccessToken) throw new Error("Missing Page ID or Access Token");

    // 1. Upload Photo (if image exists)
    let mediaId;
    if (imageUrl) {
      const photoUrl = `https://graph.facebook.com/v24.0/${pageId}/photos`;
      const photoRes = await fetch(photoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          published: false,
          access_token: pageAccessToken,
        }),
      });
      const photoData = await photoRes.json();
      if (!photoData.id) throw new Error(photoData.error?.message || "FB Photo upload failed");
      mediaId = photoData.id;
    }

    // 2. Publish Feed
    const feedUrl = `https://graph.facebook.com/v24.0/${pageId}/feed`;
    const payload = {
      message: caption || "",
      access_token: pageAccessToken,
    };
    if (mediaId) {
      payload.attached_media = [{ media_fbid: mediaId }];
    }

    const feedRes = await fetch(feedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const feedData = await feedRes.json();

    if (!feedData.id) throw new Error(feedData.error?.message || "FB Feed publish failed");

    log(`✅ Posted to FB Page ${pageId}`);
    return { success: true, id: feedData.id };

  } catch (err) {
    log(`❌ FB Post Error:`, err.message);
    return { success: false, error: err.message };
  }
}

/* -------------------------------------------------- 
   INSTAGRAM POST HELPER
-------------------------------------------------- */
async function postToInstagram(account, log) {
  try {
    const { igUserId, accessToken, caption, imageUrl } = account;
    if (!igUserId || !accessToken || !imageUrl) throw new Error("Missing IG details");

    // 1. Create Media Container
    const mediaUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
    const mediaRes = await fetch(mediaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption || "",
        access_token: accessToken,
      }),
    });
    const mediaData = await mediaRes.json();
    if (!mediaData.id) throw new Error(mediaData.error?.message || "IG Media creation failed");

    // Wait for processing
    await new Promise(r => setTimeout(r, 5000));

    // 2. Publish
    const publishUrl = `https://graph.facebook.com/v24.0/${igUserId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: mediaData.id,
        access_token: accessToken,
      }),
    });
    const publishData = await publishRes.json();

    if (!publishData.id) throw new Error(publishData.error?.message || "IG Publish failed");

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
export async function GET() {
  debugLogs = [];
  log("🚀 Cron started");

  try {
    await dbConnect();
    log("📦 Mongo connected");

    const now = new Date();

    // 1. Find candidates with LIMIT and SORT
    // We limit to 25 posts per run to process batches efficiently.
    // We sort by scheduledDate ASC to process the oldest pending posts first.
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
      return NextResponse.json({ success: true, message: "No scheduled posts due.", logs: debugLogs });
    }

    log(`Found ${candidates.length} posts to process (Batch Limit: ${BATCH_SIZE}).`);

    const stats = {
      total: candidates.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      posted: 0,
    };

    for (const candidate of candidates) {
      // 2. ATOMIC LOCK: Transition to 'processing' to prevent race conditions
      const post = await Post.findOneAndUpdate(
        { _id: candidate._id, status: "scheduled" }, // Ensure we only pick up scheduled ones
        { status: "processing" },
        { new: true }
      );

      if (!post) {
        log(`- Post ${candidate._id} skipped (locked or status changed).`);
        stats.skipped++;
        continue;
      }

      const postId = post._id.toString();
      log(`📝 Processing post ${post._id.toString()}`);

      const hasGmb = Array.isArray(post.locations) && post.locations.length > 0;
      const hasFb = Array.isArray(post.fbPages) && post.fbPages.length > 0;
      const hasIg = Array.isArray(post.igPages) && post.igPages.length > 0;

      if (!hasGmb && !hasFb && !hasIg) {
        log("⚠ Invalid or empty targets (No GMB, FB, or IG)");
        post.status = "failed";
        post.error = "Scheduled post has no targets.";
        await post.save();
        stats.failed++;
        continue;
      }

      const user = await User.findOne({ userId: post.userId });
      if (!user) {
        log("❌ User not found for post " + postId);
        post.status = "failed";
        post.error = "Owner user not found.";
        await post.save();
        stats.skipped++;
        continue;
      }

      let failed = false;

      /* -------------------------------------------------- 
         1. PROCESS FACEBOOK
      -------------------------------------------------- */
      if (hasFb) {
        log(`Processing ${post.fbPages.length} Facebook pages`);
        for (let i = 0; i < post.fbPages.length; i++) {
          const page = post.fbPages[i];
          if (page.isPosted) continue;

          // Fetch fresh token from DB to ensure we have the latest permissions/validity
          let tokenToUse = page.pageAccessToken;
          try {
            const freshPage = await FacebookPage.findOne({ pageId: page.pageId, userId: post.userId });
            if (freshPage) {
              // Option A: Generate a brand new page token using the saved user long-term token
              if (freshPage.userAccessToken) {
                tokenToUse = await getFreshPageToken(freshPage.userAccessToken, page.pageId);
                log(`🔄 Generated fresh FB page token via User Token for ${page.pageId}`);
              }
              // Option B: Fallback to the stored page token
              else if (freshPage.pageAccessToken) {
                tokenToUse = freshPage.pageAccessToken;
                log(`🔄 Using stored fresh FB token for page ${page.pageId}`);
              }
            }
          } catch (e) {
            log(`⚠️ Failed to fetch fresh FB token: ${e.message}`);
          }

          const pagePayload = page.toObject ? page.toObject() : { ...page };
          pagePayload.pageAccessToken = tokenToUse;

          const result = await postToFacebook(pagePayload, log);
          if (result.success) {
            page.isPosted = true;
            page.postedAt = new Date();
            page.postId = result.id;
            page.error = null;

            // Update whenPosted for Facebook
            if (!post.whenPosted) post.whenPosted = {};
            post.whenPosted.facebook = "posted";
            post.markModified('whenPosted');
          } else {
            page.error = result.error;
            failed = true;
          }
        }
        post.markModified('fbPages');
      }

      /* -------------------------------------------------- 
         2. PROCESS INSTAGRAM
      -------------------------------------------------- */
      if (hasIg) {
        log(`Processing ${post.igPages.length} Instagram accounts`);
        for (let i = 0; i < post.igPages.length; i++) {
          const account = post.igPages[i];
          if (account.isPosted) continue;

          // Attempt to refresh IG token (which is usually a linked FB page token)
          let tokenToUse = account.accessToken;
          try {
            // Assuming account.pageId exists or we can find it via igUserId if you store it. 
            // If not, we rely on the stored token.
            // If you store the linked Page ID in your IG account object:
            if (account.pageId) {
              const freshPage = await FacebookPage.findOne({ pageId: account.pageId, userId: post.userId });
              if (freshPage && freshPage.userAccessToken) {
                tokenToUse = await getFreshPageToken(freshPage.userAccessToken, account.pageId);
                log(`🔄 Generated fresh IG (Page) token for ${account.pageId}`);
              }
            }
          } catch (e) {
            log(`⚠️ Failed to refresh IG token: ${e.message}`);
          }

          const accountPayload = account.toObject ? account.toObject() : { ...account };
          accountPayload.accessToken = tokenToUse;

          const result = await postToInstagram(accountPayload, log);
          if (result.success) {
            account.isPosted = true;
            account.postedAt = new Date();
            account.postId = result.id;
            account.error = null;

            // Update whenPosted for Instagram
            if (!post.whenPosted) post.whenPosted = {};
            post.whenPosted.instagram = "posted";
            post.markModified('whenPosted');
          } else {
            account.error = result.error;
            failed = true;
          }
        }
        post.markModified('igPages');
      }

      /* -------------------------------------------------- 
         3. PROCESS GMB
      -------------------------------------------------- */
      if (hasGmb) {
        const refreshToken = post.refreshToken;
        if (!refreshToken) {
          log("❌ No refresh token on post document:", postId);
          // Mark GMB locations as failed? Or fail whole post?
          // For now, we log error and set failed flag, but continue to other platforms
          failed = true;
        } else {
          try {
            log("🔑 Using stored refreshToken from post document to get a fresh access token.");
            const accessToken = await getFreshAccessToken(refreshToken);
            const processedLocIds = new Set();

            for (let i = 0; i < post.locations.length; i++) {
              const loc = post.locations[i];
              // Skip if invalid, already posted, or duplicate in this run
              if (!loc?.locationId || loc.isPosted || processedLocIds.has(loc.locationId)) continue;

              try {
                const payload = {
                  account: loc.accountId,
                  locationData: [{
                    city: loc.locationId,
                    cityName: loc.locality || loc.city || "",
                    bookUrl: loc.websiteUrl || "",
                  }],
                  output: post.aiOutput,
                  description: post.description || "",
                  accessToken,
                  checkmark: ["post", "photo", "both"].includes(post.checkmark) ? post.checkmark : "both",
                };

                log("📦 Payload:", payload);

                // Wrap the GMB call in a timeout to prevent hanging
                const result = await fetchWithTimeout(postToGmbAction(payload), 20000);

                if (!result?.ok) throw new Error("GMB post failed");

                // ✅ Wallet deduction ONLY after success
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

                if (walletData?.message !== "Wallet updated") {
                  throw new Error("Wallet deduction failed");
                }

                log("🪙 20 coins deducted via wallet action");

                // Mark this location and any duplicates as posted
                post.locations.forEach(l => {
                  if (l.locationId === loc.locationId) {
                    l.isPosted = true;
                    l.postedAt = new Date();
                    l.apiResponse = result;
                  }
                });

                // Update whenPosted for GMB
                if (!post.whenPosted) post.whenPosted = {};
                post.whenPosted.gmb = "posted";
                post.markModified('whenPosted');

                processedLocIds.add(loc.locationId);

              } catch (err) {
                log(`❌ Error posting to location ${loc.locationId}:`, err.message || "Unknown error");
                failed = true;
                // We don't break here, try other locations
              }
            }
          } catch (err) {
            log("❌ GMB Critical Error:", err.message);
            failed = true;
          }
        }
      }

      // Determine final status
      // If ANY target failed, we mark as failed (or partially failed).
      // Current logic: if !failed, then posted.
      if (!failed) {
        post.status = "posted";
        post.error = null;
        stats.posted++;

        // Send post published email notification
        try {
          // Determine which platform(s) were posted
          const platforms = [];
          if (post.whenPosted?.gmb === "posted") platforms.push("Google My Business");
          if (post.whenPosted?.facebook === "posted") platforms.push("Facebook");
          if (post.whenPosted?.instagram === "posted") platforms.push("Instagram");

          // Get business name from first location if available
          const businessName = post.locations?.[0]?.name || post.locations?.[0]?.city || "";
          const locationName = post.locations?.[0]?.name || "";

          // Get post URL (use websiteUrl from location if available)
          const postUrl = post.locations?.[0]?.websiteUrl || "";

          // Send email for each platform that was posted
          for (const platform of platforms) {
            const emailResponse = await fetch(new URL('/api/send-post-published-email', req.url).toString(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: post.userId,
                platform: platform,
                businessName: businessName,
                locationName: locationName,
                postUrl: postUrl,
              }),
            });

            const emailResult = await emailResponse.json();
            if (emailResult.success) {
              log(`📧 Post published email sent to user for ${platform}`);
            } else {
              log(`⚠️ Failed to send post published email for ${platform}:`, emailResult.message);
            }
          }
        } catch (emailError) {
          log(`⚠️ Error sending post published email:`, emailError.message);
          // Don't fail the post if email fails
        }
      } else {
        post.status = "failed";
        post.error = "One or more targets failed to post.";
        stats.failed++;
      }

      await post.save();
      stats.processed++;
    }

    log("✅ Batch processing complete", stats);
    return NextResponse.json({ success: true, stats, logs: debugLogs });

  } catch (err) {
    log("💥 CRON CRASH", err.stack);
    return NextResponse.json({ success: false, error: err.message, logs: debugLogs });
  }
}
