// app/api/cron/autoreply/route.js

import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const FETCH_REVIEWS_API = "https://review.limbutech.in/fetch-reviews";
const REPLY_REVIEW_API = "https://review.limbutech.in/reply-review";

const STAR_RATING_MAP = {
  FIVE: 5,
  FOUR: 4,
  THREE: 3,
  TWO: 2,
  ONE: 1,
};

/**
 * Refresh Google Access Token
 */
async function getFreshAccessToken(refreshToken) {
  console.log("🔄 Refreshing access token...");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(30000),
  });

  const raw = await res.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("❌ Invalid token refresh response:", raw);
    throw new Error("Invalid token refresh response");
  }

  if (!res.ok) {
    console.error("❌ Token refresh failed:", data);
    throw new Error(data.error_description || data.error || "Token refresh failed");
  }

  console.log("✅ Access token refreshed successfully");
  return data.access_token;
}

/**
 * Fetch ALL paginated reviews (mirrors client-side fetchAllReviews)
 */
async function fetchAllReviews(acc_id, locationIds, accessToken) {
  const allReviews = [];
  let pageToken = null;
  let pageCount = 0;
  const maxPages = 10;

  do {
    pageCount++;

    const requestBody = {
      acc_id,
      locationIds,
      access_token: accessToken,
      ...(pageToken && { pageToken }),
    };

    console.log(`📄 [fetchAllReviews] Page ${pageCount} request payload:`, JSON.stringify(requestBody, null, 2));

    const res = await fetch(FETCH_REVIEWS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ [fetchAllReviews] Page ${pageCount} failed:`, res.status, errorBody);
      throw new Error(`FETCH_REVIEWS_${res.status}`);
    }

    const raw = await res.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error(`❌ [fetchAllReviews] Invalid response on page ${pageCount}:`, raw);
      throw new Error("Invalid reviews response");
    }

    console.log(`📄 [fetchAllReviews] Page ${pageCount} response — reviews: ${data?.reviews?.length || 0}, nextPageToken: ${data?.nextPageToken || "none"}`);

    if (data.reviews && Array.isArray(data.reviews)) {
      allReviews.push(...data.reviews);
      pageToken = data.nextPageToken || null;
    } else {
      pageToken = null;
    }

    if (pageCount >= maxPages) {
      console.warn(`⚠️ [fetchAllReviews] Reached maxPages limit (${maxPages}), stopping pagination`);
      break;
    }
  } while (pageToken);

  console.log(`✅ [fetchAllReviews] Total reviews fetched: ${allReviews.length}`);
  return allReviews;
}

/**
 * Get business info for a specific location — throws if missing
 */
function getBusinessInfo(locationInfo, locationId) {
  if (!locationInfo) {
    console.error(`❌ [getBusinessInfo] locationInfo is undefined for locationId: "${locationId}"`);
    throw new Error(`LOCATION_NOT_MATCHED: No location found for locationId "${locationId}"`);
  }

  const businessName = locationInfo?.title || null;
  const businessCategory =
    locationInfo?.categories?.primaryCategory?.displayName || locationInfo?.title || null;

  if (!businessCategory) {
    console.error(`❌ [getBusinessInfo] Neither "primaryCategory.displayName" nor "title" found for locationId: "${locationId}"`, locationInfo);
    throw new Error(`BUSINESS_CATEGORY_MISSING: No category or title found for locationId "${locationId}"`);
  }

  if (!businessName) {
    console.error(`❌ [getBusinessInfo] "title" not found for locationId: "${locationId}"`, locationInfo);
    throw new Error(`BUSINESS_NAME_MISSING: No title found for locationId "${locationId}"`);
  }

  console.log(`✅ [getBusinessInfo] Resolved — name: "${businessName}", category: "${businessCategory}"`);
  return { businessName, businessCategory };
}

/**
 * Send AI Reply
 */
async function sendAIReply({ accessToken, acc_id, locationId, review, locationInfo }) {
  try {
    // ✅ Throws if location info is missing or incomplete
    const { businessName, businessCategory } = getBusinessInfo(locationInfo, locationId);

    // ✅ Numeric star rating (consistent with client-side)
    const starRating = STAR_RATING_MAP[review.starRating] || 5;

    const payload = {
      acc_id,
      access_token: accessToken,
      locationIds: locationId,
      Review_ID: review.reviewId,
      Reviewer_Name: review.reviewer?.displayName || "Customer",
      Star_Rating: starRating,
      Review_Content: review.comment || "No comment provided",
      Business_Language: "English",
      Business_Category: businessCategory,
      Business_Name: businessName,
    };

    console.log(`🤖 [sendAIReply] Payload for review "${review.reviewId}":`, JSON.stringify(payload, null, 2));

    const res = await fetch(REPLY_REVIEW_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const raw = await res.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error("❌ [sendAIReply] Invalid AI reply response:", raw);
      throw new Error("Invalid AI reply response");
    }

    console.log(`📩 [sendAIReply] Response for review "${review.reviewId}":`, data);

    if (!res.ok || data?.status !== true) {
      console.error(`❌ [sendAIReply] Failed for review "${review.reviewId}":`, data);
      throw new Error("AI reply failed");
    }

    console.log(`✅ [sendAIReply] Successfully replied to review "${review.reviewId}"`);
    return true;
  } catch (err) {
    console.error(`❌ [sendAIReply] Error for review "${review.reviewId}":`, err.message);
    return false;
  }
}

/**
 * Main Cron Handler
 */
export async function GET() {
  console.log("\n==============================");
  console.log("[CRON] Auto Reply Triggered:", new Date().toISOString());
  console.log("==============================\n");

  try {
    await dbConnect();

    const users = await AutoReply.find({ autoReply: true });
    console.log(`[CRON] Found ${users.length} auto-reply user(s)`);

    if (users.length === 0) {
      return NextResponse.json({ success: true, message: "No auto-reply users found" });
    }

    for (const user of users) {
      const userIdentifier = user.userId || user._id?.toString();
      console.log(`\n👤 Processing user: ${userIdentifier}`);

      try {
        if (!user.refreshToken) {
          console.warn(`⚠️ User ${userIdentifier} has no refresh token — skipping`);
          continue;
        }

        if (!user.locations || user.locations.length === 0) {
          console.warn(`⚠️ User ${userIdentifier} has no locations — skipping`);
          continue;
        }

        // Refresh Access Token
        const accessToken = await getFreshAccessToken(user.refreshToken);

        // Group Locations By Account
        const locationsByAccount = user.locations.reduce((acc, loc) => {
          if (loc.accountId && loc.locationId) {
            if (!acc[loc.accountId]) acc[loc.accountId] = [];
            acc[loc.accountId].push(loc);
          }
          return acc;
        }, {});

        console.log(`🏢 Accounts to process: ${Object.keys(locationsByAccount).length}`);

        for (const [acc_id, locations] of Object.entries(locationsByAccount)) {
          try {
            console.log(`\n🏢 Processing account: ${acc_id}`);
            console.log(`📍 Locations in account:`, locations.map((l) => l.locationId));

            const locationIds = locations.map((loc) => loc.locationId);

            // ✅ Paginated fetch — not just first page
            const reviews = await fetchAllReviews(acc_id, locationIds, accessToken);
            console.log(`📝 Total reviews fetched: ${reviews.length}`);

            if (!reviews.length) {
              console.log(`ℹ️ No reviews found for account ${acc_id}`);
              continue;
            }

            // Filter Pending Reviews (no reply yet)
            const pendingReviews = reviews.filter(
              (review) =>
                !review.reviewReply ||
                !review.reviewReply.comment ||
                !review.reviewReply.comment.trim()
            );

            console.log(`🕐 Pending (unreplied) reviews: ${pendingReviews.length}`);

            if (!pendingReviews.length) {
              console.log(`ℹ️ All reviews already replied for account ${acc_id}`);
              continue;
            }

            // Send AI Replies
            const results = await Promise.allSettled(
              pendingReviews.map(async (review) => {
                try {
                  const [, review_acc_id, , locationId] = review.name.split("/");

                  // ✅ Match exact location — warn if not found
                  const locationInfo = locations.find((loc) => loc.locationId === locationId);

                  if (!locationInfo) {
                    console.warn(`⚠️ [CRON] No locationInfo found for locationId "${locationId}" in review "${review.reviewId}" — skipping`);
                    return false;
                  }

                  return await sendAIReply({
                    accessToken,
                    acc_id: review_acc_id,
                    locationId,
                    review,
                    locationInfo,
                  });
                } catch (err) {
                  console.error(`❌ Review processing error for "${review.reviewId}":`, err.message);
                  return false;
                }
              })
            );

            const successCount = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
            const failedCount = results.length - successCount;

            console.log(`\n📊 Account ${acc_id} Results:`);
            console.log(`   ✅ Success: ${successCount}`);
            console.log(`   ❌ Failed:  ${failedCount}`);
          } catch (accountErr) {
            console.error(`❌ Account Processing Error (${acc_id}):`, accountErr.message);
          }
        }
      } catch (userErr) {
        console.error(`❌ User Processing Error (${userIdentifier}):`, userErr.message);

        // Disable auto-reply if refresh token is invalid
        if (
          userErr.message.includes("Token refresh failed") ||
          userErr.message.includes("invalid_grant")
        ) {
          await AutoReply.updateOne(
            { _id: user._id },
            { autoReply: false, error: "Invalid refresh token" }
          );
          console.warn(`🚫 Disabled auto-reply for user ${userIdentifier} due to invalid token`);
        }
      }
    }

    console.log("\n✅ CRON COMPLETED SUCCESSFULLY\n");
    return NextResponse.json({ success: true, message: "Auto reply cron executed successfully" });
  } catch (err) {
    console.error("\n❌ CRON MAIN ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Cron execution failed" },
      { status: 500 }
    );
  }
}