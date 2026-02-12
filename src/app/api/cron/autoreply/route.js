// app/api/cron/autoreply/route.js
import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import { NextResponse } from "next/server";

// Make sure this runs in Node.js (for Mongoose)
export const runtime = "nodejs";
// Optional: increase timeout if needed (Vercel Pro/Team)
export const maxDuration = 60;

async function getFreshAccessToken(refreshToken) {
  console.log("🔄 Refreshing access token for cron auto-reply");

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
    console.error("❌ Token refresh failed for cron auto-reply", data);
    throw new Error(data.error_description || "Token refresh failed");
  }

  console.log("✅ Access token refreshed for cron auto-reply");
  return data.access_token;
}


export async function GET() {
  console.log("[CRON] /api/cron/autoreply triggered at", new Date().toISOString());

  try {
    await dbConnect();

    // Get all users who enabled auto reply
    const users = await AutoReply.find({ autoReply: true });
    

    console.log("[CRON] Auto users found:", users.length);

    for (const user of users) {
      try {
        const userIdentifier = user.userId || user._id;
        if (!user.refreshToken) {
          console.log(`[CRON] User ${userIdentifier} has no refresh token, skipping.`);
          continue;
        }

        if (!user.locations || user.locations.length === 0) {
          console.log(`[CRON] User ${userIdentifier} has no locations, skipping.`);
          continue;
        }

        // Try to obtain an access token. We'll try-refresh on demand if n8n returns 401.
        let accessToken = null;
        try {
          accessToken = await getFreshAccessToken(user.refreshToken);
        } catch (err) {
          console.error(`[CRON] Could not refresh access token initially for user ${userIdentifier}:`, err?.message || err);
          // Mark autoReply disabled and continue to next user
          await AutoReply.updateOne({ _id: user._id }, { autoReply: false, error: 'Initial token refresh failed. Disabled auto-reply.' });
          console.log(`[CRON] Disabled auto-reply for user ${userIdentifier} due to initial token refresh failure.`);
          continue;
        }

        // Group locations by accountId to handle multiple accounts per user
        const locationsByAccount = user.locations.reduce((acc, location) => {
          if (location.accountId && location.locationId) {
            if (!acc[location.accountId]) {
              acc[location.accountId] = [];
            }
            acc[location.accountId].push(location.locationId);
          }
          return acc;
        }, {});

        console.log(`[CRON] User ${userIdentifier} has locations in ${Object.keys(locationsByAccount).length} account(s).`);

        // Process each account for the user
        for (const [acc_id, locationIds] of Object.entries(locationsByAccount)) {
          try {
            console.log(`[CRON] Processing account ${acc_id} with ${locationIds.length} location(s) for user ${userIdentifier}.`);
            
            // 1) Fetch reviews from n8n for this account
            let res = await fetch(
              "https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ acc_id, locationIds, access_token: accessToken }),
              }
            );

            // If unauthorized/forbidden, try refreshing token once and retry
            if (res.status === 401 || res.status === 403) {
              console.warn(`[CRON] Received ${res.status} when fetching reviews for user ${userIdentifier}, account ${acc_id}. Refreshing token and retrying.`);
              try {
                accessToken = await getFreshAccessToken(user.refreshToken);
              } catch (err) {
                console.error(`[CRON] Token refresh failed while handling auth error for user ${userIdentifier}:`, err?.message || err);
                await AutoReply.updateOne({ _id: user._id }, { autoReply: false, error: 'Invalid refresh token. Disabled auto-reply.' });
                console.log(`[CRON] Disabled auto-reply for user ${userIdentifier} due to token refresh failure.`);
                break; // stop processing accounts for this user
              }

              res = await fetch(
                "https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ acc_id, locationIds, access_token: accessToken }),
                }
              );
            }

            if (!res.ok) {
              const errorBody = await res.text();
              console.error(`[CRON] Failed to fetch reviews for user ${userIdentifier}, account ${acc_id}`, "status:", res.status, "body:", errorBody);
              continue;
            }

            const data = await res.json();
            if (!data?.reviews || !Array.isArray(data.reviews)) {
              console.log(`[CRON] No reviews array for user ${userIdentifier}, account ${acc_id}`);
              continue;
            }

            // 2) Filter reviews that don't have any reply
            const pending = data.reviews.filter((r) => !r.reviewReply?.comment?.trim());
            console.log(`[CRON] User ${userIdentifier}, account ${acc_id} has ${pending.length} pending reviews.`);

            // 3) Auto-reply for each pending review
            for (const r of pending) {
                try {
                const [_, review_acc_id, , locationId] = r.name.split("/");

                // POST reply, retry once on 401 or network error
                let replyRes;
                try {
                  replyRes = await fetch(
                    "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        access_token: accessToken,
                        acc_id: review_acc_id,
                        locationIds: locationId,
                        Reviewer_Name: r.reviewer?.displayName || "Customer",
                        Star_Rating: r.starRating,
                        Review_Content: r.comment,
                        Review_ID: r.reviewId,
                      }),
                    }
                  );
                } catch (networkErr) {
                  console.warn(`[CRON] Network error when sending reply for review ${r.reviewId}, retrying once`, networkErr?.message || networkErr);
                  // retry once
                  try {
                    replyRes = await fetch(
                      "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          access_token: accessToken,
                          acc_id: review_acc_id,
                          locationIds: locationId,
                          Reviewer_Name: r.reviewer?.displayName || "Customer",
                          Star_Rating: r.starRating,
                          Review_Content: r.comment,
                          Review_ID: r.reviewId,
                        }),
                      }
                    );
                  } catch (secondErr) {
                    console.error(`[CRON] Second attempt failed for review ${r.reviewId}`, secondErr);
                    continue;
                  }
                }

                // If unauthorized, try refreshing token and retry once
                if (replyRes && (replyRes.status === 401 || replyRes.status === 403)) {
                  console.warn(`[CRON] Reply webhook returned ${replyRes.status} for review ${r.reviewId}. Refreshing token and retrying.`);
                  try {
                    accessToken = await getFreshAccessToken(user.refreshToken);
                  } catch (err) {
                    console.error(`[CRON] Token refresh failed when replying to review ${r.reviewId} for user ${userIdentifier}:`, err?.message || err);
                    await AutoReply.updateOne({ _id: user._id }, { autoReply: false, error: 'Invalid refresh token. Disabled auto-reply.' });
                    console.log(`[CRON] Disabled auto-reply for user ${userIdentifier} due to token refresh failure while replying.`);
                    break; // stop processing pending reviews for this account
                  }

                  try {
                    replyRes = await fetch(
                      "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          access_token: accessToken,
                          acc_id: review_acc_id,
                          locationIds: locationId,
                          Reviewer_Name: r.reviewer?.displayName || "Customer",
                          Star_Rating: r.starRating,
                          Review_Content: r.comment,
                          Review_ID: r.reviewId,
                        }),
                      }
                    );
                  } catch (finalErr) {
                    console.error(`[CRON] Final attempt failed for review ${r.reviewId}`, finalErr);
                    continue;
                  }
                }

                if (replyRes && !replyRes.ok) {
                  const bodyText = await replyRes.text().catch(() => "");
                  console.error(`[CRON] Reply webhook responded with status ${replyRes.status} for review ${r.reviewId}`, bodyText);
                } else {
                  console.log(`[CRON] Sent review ${r.reviewId} for user ${userIdentifier} to auto-reply webhook.`);
                }
              } catch (err) {
                console.error("[CRON] Error replying to review", r.reviewId, "user", userIdentifier, err);
              }
            }
          } catch(err) {
              console.error(`[CRON] Error processing account ${acc_id} for user ${userIdentifier}`, err);
          }
        }
      } catch (err) {
        const userIdentifier = user.userId || user._id;
        console.error("[CRON] Error in user loop for user", userIdentifier, err);
        if (err.message.includes("Token refresh failed")) {
            await AutoReply.updateOne({ _id: user._id }, { autoReply: false, error: 'Invalid refresh token. Disabled auto-reply.' });
            console.log(`[CRON] Disabled auto-reply for user ${userIdentifier} due to token refresh failure.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Cron executed" });
  } catch (err) {
    console.error("[CRON] Main error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
