/**
 * GET /api/admin/gmb-broken-connections
 *
 * Un saare businesses ki list jinki automation ek TOOTE Google connection ki
 * wajah se ruki hui hai — ek jagah, taaki team roz check kar sake.
 *
 * Kyun chahiye tha: token marne par automation chup-chaap band ho jati thi.
 * RO Care India par 19 Aug se 13 din tak roz 125 locations fail hote rahe aur
 * kisi ko pata hi nahi chala. `automation-logs` me line to thi, par 176 logs me
 * dhoondhni padti thi. Ye endpoint seedha "kis-kis ko reconnect chahiye" deta
 * hai, contact details ke saath.
 *
 * Query params:
 *   format=text  — plain text (terminal / WhatsApp me paste karne layak)
 *
 * Note: sirf active automation plans wale users dikhte hain by default, kyunki
 * jinki automation chal hi nahi rahi unka toota connection urgent nahi hai.
 *   all=1        — sab toote connections, chahe automation on ho ya na ho
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import AutomationPlan from "@/models/AutomationPlan";
import Post from "@/models/PostStatus";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const REASON_LABEL = {
  invalid_grant: "Token revoked — client ne Google se access hataya ya password reset kiya",
  insufficient_scope: "Business Profile permission missing — consent par checkbox tick nahi hua",
  no_refresh_token: "Connect adhoora reh gaya — koi refresh token stored nahi",
};

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const wantAll = searchParams.get("all") === "1";

    const broken = await GmbConnection.find({ invalid: true })
      .select("userId email invalidReason connectedBy updatedAt reconnectAlertedAt consecutiveAuthFailures")
      .sort({ updatedAt: -1 })
      .lean();

    if (!broken.length) {
      return NextResponse.json({ success: true, count: 0, connections: [], message: "Koi toota connection nahi 🎉" });
    }

    const userIds = [...new Set(broken.map((c) => c.userId).filter(Boolean))];

    const [plans, users] = await Promise.all([
      AutomationPlan.find({ userId: { $in: userIds } })
        .select("userId businessName active automationEnabled locations lastPostDate")
        .lean(),
      User.find({ userId: { $in: userIds } })
        .select("userId fullName email phone mobileNumber accountManagerName")
        .lean(),
    ]);
    const planBy = new Map(plans.map((p) => [p.userId, p]));
    const userBy = new Map(users.map((u) => [u.userId, u]));

    // Asar kitna hai: aakhri 7 din me kitne posts is wajah se fail hue.
    const since = new Date(Date.now() - 7 * 86400000);
    const failAgg = await Post.aggregate([
      { $match: { userId: { $in: userIds }, createdAt: { $gte: since }, status: { $in: ["failed", "partial_failed"] } } },
      { $group: { _id: "$userId", posts: { $sum: 1 } } },
    ]);
    const failBy = new Map(failAgg.map((f) => [f._id, f.posts]));

    let rows = broken.map((c) => {
      const plan = planBy.get(c.userId);
      const u = userBy.get(c.userId);
      const locationCount = plan?.locations?.length || 0;
      const failedPosts7d = failBy.get(c.userId) || 0;
      return {
        userId: c.userId,
        businessName: plan?.businessName || u?.fullName || "",
        googleEmail: c.email || "",
        reason: c.invalidReason || "unknown",
        reasonText: REASON_LABEL[c.invalidReason] || c.invalidReason || "unknown",
        connectedBy: c.connectedBy,
        automationActive: !!(plan?.active && plan?.automationEnabled),
        locationCount,
        // Roz kitni locations block ho rahi hain — priority isi se tay hoti hai.
        blockedPerDay: plan?.active && plan?.automationEnabled ? locationCount : 0,
        failedPosts7d,
        brokenSince: c.updatedAt,
        lastAlertedAt: c.reconnectAlertedAt || null,
        clientEmail: u?.email || "",
        clientPhone: u?.phone || u?.mobileNumber || "",
        accountManager: u?.accountManagerName || "Unassigned",
        lastPostDate: plan?.lastPostDate || null,
      };
    });

    if (!wantAll) rows = rows.filter((r) => r.automationActive);
    // Sabse zyada nuksan wale sabse upar.
    rows.sort((a, b) => b.blockedPerDay - a.blockedPerDay || b.failedPosts7d - a.failedPosts7d);

    const totalBlockedPerDay = rows.reduce((n, r) => n + r.blockedPerDay, 0);

    if (searchParams.get("format") === "text") {
      const lines = [
        `GMB reconnect chahiye: ${rows.length} business — roz ${totalBlockedPerDay} locations block`,
        "",
      ];
      for (const r of rows) {
        lines.push(`• ${r.businessName || r.userId}  (${r.locationCount} locations)`);
        lines.push(`   Google: ${r.googleEmail}   |  manager: ${r.accountManager}`);
        lines.push(`   wajah: ${r.reasonText}`);
        lines.push(`   client: ${r.clientEmail || "-"}  ${r.clientPhone || ""}`);
        lines.push(`   7 din me failed posts: ${r.failedPosts7d}   toota: ${r.brokenSince ? new Date(r.brokenSince).toISOString().slice(0, 10) : "-"}`);
        lines.push("");
      }
      return new Response(lines.join("\n"), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      totalBlockedPerDay,
      connections: rows,
    });
  } catch (error) {
    console.error("GET /api/admin/gmb-broken-connections:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
