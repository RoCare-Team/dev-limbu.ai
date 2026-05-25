// app/api/cron/autoreply/route.js

import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const FETCH_REVIEWS_API = "https://review.limbutech.in/fetch-reviews";

const REPLY_REVIEW_API = "https://review.limbutech.in/reply-review";

/**
 * Refresh Google Access Token
 */
async function getFreshAccessToken(refreshToken) {
  console.log("🔄 Refreshing access token...");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

    throw new Error(
      data.error_description || data.error || "Token refresh failed",
    );
  }

  console.log("✅ Access token refreshed");

  return data.access_token;
}

/**
 * Fetch Reviews
 */
async function fetchReviews(acc_id, locationIds, accessToken) {
  try {
    const res = await fetch(FETCH_REVIEWS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acc_id,
        locationIds,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorBody = await res.text();

      console.error("❌ Failed to fetch reviews:", res.status, errorBody);

      throw new Error(`FETCH_REVIEWS_${res.status}`);
    }

    const raw = await res.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error("❌ Invalid reviews response:", raw);

      throw new Error("Invalid reviews response");
    }

    return data?.reviews || [];
  } catch (err) {
    console.error("❌ fetchReviews error:", err);
    throw err;
  }
}

/**
 * Send AI Reply
 */
async function sendAIReply({
  accessToken,
  acc_id,
  locationId,
  review,
  locationInfo,
}) {
  try {
    const payload = {
      acc_id,
      access_token: accessToken,

      locationIds: locationId,

      Review_ID: review.reviewId,

      Reviewer_Name: review.reviewer?.displayName || "Customer",

      Star_Rating: review.starRating || "FIVE",

      Review_Content: review.comment || "No comment provided",

      Business_Language: "English",

      Business_Category:
        locationInfo?.categories?.primaryCategory?.displayName || "Business",

      Business_Name: locationInfo?.title || "Business",
    };

    const res = await fetch(REPLY_REVIEW_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const raw = await res.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error("❌ Invalid AI reply response:", raw);

      throw new Error("Invalid AI reply response");
    }

    if (!res.ok || data?.status !== true) {
      console.error("❌ Failed AI reply:", review.reviewId, data);

      throw new Error("AI reply failed");
    }

    console.log(`✅ Successfully replied to review ${review.reviewId}`);

    return true;
  } catch (err) {
    console.error(`❌ Error replying to review ${review.reviewId}:`, err);

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

    const users = await AutoReply.find({
      autoReply: true,
    });

    console.log(`[CRON] Found ${users.length} auto-reply users`);

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No auto-reply users found",
      });
    }

    for (const user of users) {
      const userIdentifier = user.userId || user._id?.toString();

      console.log(`\n👤 Processing user: ${userIdentifier}`);

      try {
        /**
         * Validate User Data
         */
        if (!user.refreshToken) {
          console.log(`⚠️ User ${userIdentifier} has no refresh token`);
          continue;
        }

        if (!user.locations || user.locations.length === 0) {
          console.log(`⚠️ User ${userIdentifier} has no locations`);
          continue;
        }

        /**
         * Refresh Access Token
         */
        const accessToken = await getFreshAccessToken(user.refreshToken);

        /**
         * Group Locations By Account
         */
        const locationsByAccount = user.locations.reduce((acc, loc) => {
          if (loc.accountId && loc.locationId) {
            if (!acc[loc.accountId]) {
              acc[loc.accountId] = [];
            }

            acc[loc.accountId].push(loc);
          }

          return acc;
        }, {});

        /**
         * Process Accounts
         */
        for (const [acc_id, locations] of Object.entries(locationsByAccount)) {
          try {
            console.log(`\n🏢 Processing account ${acc_id}`);

            const locationIds = locations.map((loc) => loc.locationId);

            /**
             * Fetch Reviews
             */
            const reviews = await fetchReviews(
              acc_id,
              locationIds,
              accessToken,
            );

            console.log(`📝 Found ${reviews.length} reviews`);

            if (!reviews.length) {
              continue;
            }

            /**
             * Filter Pending Reviews
             */
            const pendingReviews = reviews.filter((review) => {
              return (
                !review.reviewReply ||
                !review.reviewReply.comment ||
                !review.reviewReply.comment.trim()
              );
            });

            console.log(`🤖 Pending reviews: ${pendingReviews.length}`);

            if (!pendingReviews.length) {
              continue;
            }

            /**
             * Send Replies Parallel
             */
            const results = await Promise.allSettled(
              pendingReviews.map(async (review) => {
                try {
                  const [, review_acc_id, , locationId] =
                    review.name.split("/");

                  /**
                   * Find Location Info
                   */
                  const locationInfo = locations.find(
                    (loc) => loc.locationId === locationId,
                  );

                  /**
                   * Send AI Reply
                   */
                  return await sendAIReply({
                    accessToken,
                    acc_id: review_acc_id,
                    locationId,
                    review,
                    locationInfo,
                  });
                } catch (err) {
                  console.error("❌ Review processing error:", err);

                  return false;
                }
              }),
            );

            /**
             * Stats
             */
            const successCount = results.filter(
              (r) => r.status === "fulfilled" && r.value === true,
            ).length;

            const failedCount = results.length - successCount;

            console.log(`✅ Success Replies: ${successCount}`);

            console.log(`❌ Failed Replies: ${failedCount}`);
          } catch (accountErr) {
            console.error(
              `❌ Account Processing Error (${acc_id}):`,
              accountErr,
            );
          }
        }
      } catch (userErr) {
        console.error(`❌ User Processing Error (${userIdentifier}):`, userErr);

        /**
         * Disable Auto Reply
         * if refresh token invalid
         */
        if (userErr.message.includes("Token refresh failed")) {
          await AutoReply.updateOne(
            {
              _id: user._id,
            },
            {
              autoReply: false,
              error: "Invalid refresh token",
            },
          );

          console.log(`🚫 Disabled auto-reply for ${userIdentifier}`);
        }
      }
    }

    console.log("\n✅ CRON COMPLETED SUCCESSFULLY\n");

    return NextResponse.json({
      success: true,
      message: "Auto reply cron executed successfully",
    });
  } catch (err) {
    console.error("\n❌ CRON MAIN ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Cron execution failed",
      },
      {
        status: 500,
      },
    );
  }
}
