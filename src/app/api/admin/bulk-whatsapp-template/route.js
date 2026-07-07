import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchiseRevenue from "@/models/FranchiseRevenue";

const LIMBU_URL = "https://whatsapp.limbu.ai/api/campaigns/send";
const API_KEY =
  process.env.LIMBU_AI_WHATSAPP_KEY ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { selectedRows, templateName } = body;

    if (!selectedRows?.length) {
      return NextResponse.json({
        success: false,
        message: "No users selected",
      });
    }

    // ✅ Users (phone + name ke liye)
    const users = await User.find({ userId: { $in: selectedRows } });
    const userMap = {};
    users.forEach((u) => (userMap[String(u.userId)] = u));

    // ✅ FranchiseRevenue se latest expiry (User doc ki date null/stale ho sakti hai)
    const revenues = await FranchiseRevenue.find({
      leadId: { $in: selectedRows },
      packageExpiryDate: { $ne: null },
    })
      .sort({ packageExpiryDate: -1 })
      .lean();

    const revExpiryMap = {};
    for (const r of revenues) {
      const key = String(r.leadId);
      if (
        !revExpiryMap[key] ||
        new Date(r.packageExpiryDate) > new Date(revExpiryMap[key])
      ) {
        revExpiryMap[key] = r.packageExpiryDate;
      }
    }

    const today = startOfDay(new Date());

    const results = [];
    let sent = 0;
    let skipped = 0;

    // ✅ selectedRows pe loop (missing users bhi report honge)
    for (const userId of selectedRows) {
      const user = userMap[String(userId)];

      if (!user) {
        skipped++;
        results.push({ userId, status: "skipped", reason: "user-not-found" });
        continue;
      }

      let mobile = user.mobile || user.phone || user.whatsappNumber;
      if (!mobile) {
        skipped++;
        results.push({ userId, status: "skipped", reason: "no-phone" });
        continue;
      }
      mobile = String(mobile).replace(/\D/g, "");
      if (!mobile.startsWith("91")) mobile = `91${mobile}`;

      // Best-available expiry: User doc -> FranchiseRevenue
      const expiryRaw = user.packageExpiryDate || revExpiryMap[String(userId)];

      if (!expiryRaw) {
        skipped++;
        results.push({ userId, status: "skipped", reason: "no-expiry-date" });
        continue;
      }

      const expiry = startOfDay(expiryRaw);
      const daysLeft = Math.round(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let templateParams = [];

      // 🔥 EXPIRY REMINDER (expiring soon) — 1..7 din baaki
      if (templateName === "plan_expired_comdown") {
        if (daysLeft > 7) {
          skipped++;
          results.push({
            userId,
            status: "skipped",
            reason: `more-than-7-days-left (${daysLeft})`,
          });
          continue;
        }
        if (daysLeft < 0) {
          skipped++;
          results.push({
            userId,
            status: "skipped",
            reason: `already-expired (${daysLeft}) — use "Plan Expired Template"`,
          });
          continue;
        }
        templateParams = [user.fullName || "User", String(Math.max(daysLeft, 0))];
      }

      // 🔥 PLAN EXPIRED — expire ho chuka ho
      else if (templateName === "limbu_ai_plan_expired") {
        if (daysLeft > 0) {
          skipped++;
          results.push({
            userId,
            status: "skipped",
            reason: `not-expired-yet (${daysLeft} days left) — use "Expiry Reminder Template"`,
          });
          continue;
        }
        templateParams = [
          user.fullName || "User",
          new Date(expiryRaw).toLocaleDateString("en-IN"),
        ];
      }

      // Unknown template — bhej do fallback params ke saath
      else {
        templateParams = [user.fullName || "User"];
      }

      const payload = {
        apiKey: API_KEY,
        campaignName: templateName,
        destination: mobile,
        userName: "Limbu AI",
        templateParams,
        source: "api",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: user.fullName || "User",
          LastName: "Customer",
        },
      };

      const response = await fetch(LIMBU_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result = {};
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { raw: responseText };
      }

      if (response.ok && result?.success !== false) {
        sent++;
        results.push({ userId, status: "sent", mobile });
      } else {
        skipped++;
        results.push({
          userId,
          status: "failed",
          reason: result?.message || result?.raw || `http-${response.status}`,
        });
      }
    }

    // ✅ Honest response — 0 sent hua to success = false + wajah
    const message =
      sent > 0
        ? `${sent} message(s) sent, ${skipped} skipped`
        : `No message sent (${skipped} skipped). Reason(s): ${results
            .map((r) => r.reason)
            .filter(Boolean)
            .join("; ")}`;

    return NextResponse.json({
      success: sent > 0,
      sent,
      skipped,
      total: selectedRows.length,
      message,
      results,
    });
  } catch (error) {
    console.log("🔥 SERVER ERROR =>", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Server error",
    });
  }
}
