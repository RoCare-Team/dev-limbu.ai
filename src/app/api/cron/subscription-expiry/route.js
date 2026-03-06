import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// This cron runs daily to check for subscriptions expiring soon
// It sends automated WhatsApp messages to users whose subscription is about to expire

export const dynamic = "force-dynamic";

// Configurable days before expiry to trigger notification
const DAYS_BEFORE_EXPIRY = 7; // Notify 7 days before expiry

export async function GET(req) {
  try {
    await dbConnect();

    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(now.getDate() + DAYS_BEFORE_EXPIRY);

    console.log(`[CRON] Subscription Expiry Check - Running at ${now.toISOString()}`);
    console.log(`[CRON] Checking for subscriptions expiring between ${now.toISOString()} and ${expiryThreshold.toISOString()}`);

    // Find users with active subscription expiring within the threshold
    // who haven't been notified yet
    const expiringUsers = await User.find({
      "subscription.status": "active",
      "subscription.expiry": {
        $gte: now,
        $lte: expiryThreshold,
      },
      $or: [
        { "subscription.expiryNotificationSent": { $exists: false } },
        { "subscription.expiryNotificationSent": false },
      ],
    }).lean();

    console.log(`[CRON] Found ${expiringUsers.length} users with expiring subscriptions`);

    const results = {
      totalFound: expiringUsers.length,
      success: 0,
      failed: 0,
      skipped: 0,
      users: [],
    };

    for (const user of expiringUsers) {
      try {
        // Skip users without phone number
        if (!user.phone) {
          results.skipped++;
          results.users.push({ userId: user.userId, status: "skipped", reason: "no_phone" });
          continue;
        }

        const phone = user.phone.replace(/\D/g, "");
        const firstName = user.fullName?.split(" ")[0] || "User";
        const planName = user.subscription?.plan || "Free";
        
        // Format expiry date
        const expiryDate = user.subscription?.expiry 
          ? new Date(user.subscription.expiry).toLocaleDateString("en-IN", { 
              day: "2-digit", 
              month: "long", 
              year: "numeric" 
            })
          : "Soon";

        // Send WhatsApp message
        const payload = {
          campaignName: "subscription_expiring_new",
          phone: `91${phone}`,
          firstName,
          planName,
          expiryDate,
          subscriptionLink: "https://limbu.ai/renew",
        };

        const response = await fetch(`${req.nextUrl.origin}/api/users-whastapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Mark notification as sent
          await User.updateOne(
            { _id: user._id },
            { $set: { "subscription.expiryNotificationSent": true } }
          );
          
          results.success++;
          results.users.push({ userId: user.userId, status: "success", phone: `91${phone}` });
          console.log(`[CRON] Sent expiry notification to ${user.userId} (${firstName})`);
        } else {
          results.failed++;
          results.users.push({ 
            userId: user.userId, 
            status: "failed", 
            error: data.message || "API error" 
          });
          console.error(`[CRON] Failed to send to ${user.userId}:`, data);
        }

      } catch (userError) {
        results.failed++;
        results.users.push({ 
          userId: user.userId, 
          status: "error", 
          error: userError.message 
        });
        console.error(`[CRON] Error processing user ${user.userId}:`, userError);
      }
    }

    console.log(`[CRON] Subscription Expiry - Completed: ${results.success} sent, ${results.failed} failed, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalFound} users`,
      ...results,
    });

  } catch (error) {
    console.error("[CRON] Subscription Expiry Error:", error);
    return NextResponse.json(
      { success: false, message: "Cron job failed", error: error.message },
      { status: 500 }
    );
  }
}
