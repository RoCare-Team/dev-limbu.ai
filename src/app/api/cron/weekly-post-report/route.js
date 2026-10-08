import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AutomationPlan from "@/models/AutomationPlan";
import User from "@/models/User";
import { uploadToS3 } from "@/utils/s3Config";
import { collectWeeklyReport, buildWeeklyReportPdf } from "@/lib/weeklyReportPdf";

/**
 * The client's weekly report: everything done on their Google profile in the
 * last 7 days — posts published, reviews replied, profile optimizations — as a
 * PDF, delivered over WhatsApp.
 *
 * Every figure is read from a record of work that actually happened (published
 * posts, and the GmbActivity rows written by the auto-reply cron and the
 * optimization endpoint). A quiet week reports a quiet week.
 *
 *   ?dryRun=1        build everything, send nothing
 *   ?userId=USR…     one user only
 *   ?skipEmpty=0     also send to clients with no activity
 */
export const dynamic = "force-dynamic";

const PLATFORM_LABELS = {
  gmb: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

const dayLabel = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const onlyUserId = searchParams.get("userId");
    const dryRun = searchParams.get("dryRun") === "1";
    const skipEmpty = searchParams.get("skipEmpty") !== "0";

    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekLabel = `${dayLabel(from)} – ${dayLabel(to)}`;

    const planQuery = { active: true, automationEnabled: true };
    if (onlyUserId) planQuery.userId = onlyUserId;
    const plans = await AutomationPlan.find(planQuery).select("userId").lean();

    const results = { week: weekLabel, plans: plans.length, sent: 0, skipped: 0, failed: 0, rows: [] };

    for (const plan of plans) {
      const user = await User.findOne({ userId: plan.userId })
        .select("userId fullName phone businessName")
        .lean();

      const data = await collectWeeklyReport({ userId: plan.userId, from, to });

      const row = {
        userId: plan.userId,
        name: user?.businessName || user?.fullName || "",
        posts: data.publishedCount,
        reviews: data.reviewReplies.length,
        optimizations: data.profileUpdates.length,
      };

      if (!user?.phone) {
        results.skipped += 1;
        results.rows.push({ ...row, status: "no phone" });
        continue;
      }
      if (skipEmpty && data.totalActions === 0) {
        results.skipped += 1;
        results.rows.push({ ...row, status: "nothing happened this week" });
        continue;
      }

      try {
        const pdf = await buildWeeklyReportPdf({ user: user || {}, from, to, data });
        const safeName = (user.businessName || user.fullName || plan.userId)
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .slice(0, 40);
        const fileName = `weekly-report-${safeName}-${from.toISOString().slice(0, 10)}.pdf`;

        const upload = await uploadToS3(pdf, fileName, "application/pdf", "weekly-reports");
        if (!upload?.success || !upload.url) {
          throw new Error(upload?.error || "PDF upload failed");
        }

        if (dryRun) {
          results.rows.push({ ...row, status: "dry run", reportUrl: upload.url });
          continue;
        }

        const platformLine =
          Object.entries(data.perPlatform)
            .map(([p, n]) => `${PLATFORM_LABELS[p] || p}: ${n}`)
            .join(", ") || "—";

        const res = await fetch(`${req.nextUrl.origin}/api/users-whastapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignName: "weekly_post_report",
            phone: user.phone,
            firstName: (user.fullName || "there").split(" ")[0],
            weekLabel,
            totalPosts: String(data.publishedCount),
            platformLine,
            reviewCount: String(data.reviewReplies.length),
            optimizationCount: String(data.profileUpdates.length),
            // Attached to the WhatsApp message as the report document.
            reportUrl: upload.url,
            reportFilename: fileName,
          }),
        });
        const sendData = await res.json().catch(() => ({}));
        if (!res.ok || sendData.success === false) {
          throw new Error(sendData.message || "WhatsApp send failed");
        }

        results.sent += 1;
        results.rows.push({ ...row, status: "sent", reportUrl: upload.url });
      } catch (err) {
        results.failed += 1;
        results.rows.push({ ...row, status: `failed: ${err.message}` });
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[CRON] weekly-post-report error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
