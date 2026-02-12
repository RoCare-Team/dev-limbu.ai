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

        const newAccessToken = await getFreshAccessToken(user.refreshToken);

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
            const res = await fetch(
              "https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  acc_id,
                  locationIds,
                  access_token: newAccessToken,
                }),
              }
            );

            if (!res.ok) {
              const errorBody = await res.text();
              console.error(`[CRON] Failed to fetch reviews for user ${userIdentifier}, account ${acc_id}`, "status:", res.status, "body:", errorBody);
              if (res.status === 401 || res.status === 403) {
                await AutoReply.updateOne({ _id: user._id }, { autoReply: false, error: 'Invalid token for an account. Disabled auto-reply.' });
                console.log(`[CRON] Disabled auto-reply for user ${userIdentifier} due to auth error on account ${acc_id}.`);
                break; 
              }
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

                await fetch(
                  "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      access_token: newAccessToken,
                      acc_id: review_acc_id,
                      locationIds: locationId,
                      Reviewer_Name: r.reviewer?.displayName || "Customer",
                      Star_Rating: r.starRating,
                      Review_Content: r.comment,
                      Review_ID: r.reviewId,
                    }),
                  }
                );
                console.log(`[CRON] Sent review ${r.reviewId} for user ${userIdentifier} to auto-reply webhook.`);
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
