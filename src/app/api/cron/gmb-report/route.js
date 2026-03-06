import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// This cron runs monthly to send GMB reports to users
// Sends reports for the previous month

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();

    const now = new Date();
    const currentMonth = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    
    // Get last month
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.toLocaleString("en-IN", { month: "long", year: "numeric" });

    console.log(`[CRON] GMB Report Automation - Running at ${now.toISOString()}`);
    console.log(`[CRON] Current month: ${currentMonth}, Last month: ${lastMonth}`);

    // Find users who have connected business (GMB) and have active subscription
    // and haven't received the report for last month yet
    const usersWithGMB = await User.find({
      isBusinessConnected: true,
      "subscription.status": "active",
      $or: [
        { "subscription.lastGmbReportSent": { $exists: false } },
        { "subscription.lastGmbReportSent": { $ne: lastMonthDate.toISOString().slice(0, 7) } },
      ],
    }).lean();
    

    console.log(`[CRON] Found ${usersWithGMB.length} users with GMB connected`);

    const results = {
      totalFound: usersWithGMB.length,
      success: 0,
      failed: 0,
      skipped: 0,
      users: [],
    };

    // Base URL for GMB report - should be configured based on your system
    const REPORT_BASE_URL = process.env.GMB_REPORT_URL || "https://limbu.ai/dashboard";

    for (const user of usersWithGMB) {
      try {
        // Skip users without phone number
        if (!user.phone) {
          results.skipped++;
          results.users.push({ userId: user.userId, status: "skipped", reason: "no_phone" });
          continue;
        }

        const phone = user.phone.replace(/\D/g, "");
        const firstName = user.fullName?.split(" ")[0] || "User";

        // Generate report URL for last month
        const reportUrl = `${REPORT_BASE_URL}?userId=${user.userId}&month=last`;

        // Send WhatsApp message for last month's report
        const payload = {
          campaignName: "gmb_report",
          phone: `91${phone}`,
          firstName,
          reportUrl,
          month: "last", // Send last month's report
        };

        const response = await fetch(`${req.nextUrl.origin}/api/users-whastapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Mark report as sent for this month
          await User.updateOne(
            { _id: user._id },
            { 
              $set: { 
                "subscription.lastGmbReportSent": lastMonthDate.toISOString().slice(0, 7)
              } 
            }
          );
          
          results.success++;
          results.users.push({ userId: user.userId, status: "success", phone: `91${phone}`, month: lastMonth });
          console.log(`[CRON] Sent GMB report to ${user.userId} (${firstName}) for ${lastMonth}`);
        } else {
          results.failed++;
          results.users.push({ 
            userId: user.userId, 
            status: "failed", 
            error: data.message || "API error" 
          });
          console.error(`[CRON] Failed to send GMB report to ${user.userId}:`, data);
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

    console.log(`[CRON] GMB Report - Completed: ${results.success} sent, ${results.failed} failed, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalFound} users`,
      currentMonth,
      lastMonth,
      ...results,
    });

  } catch (error) {
    console.error("[CRON] GMB Report Error:", error);
    return NextResponse.json(
      { success: false, message: "Cron job failed", error: error.message },
      { status: 500 }
    );
  }
}
