import Admin from "@/models/Admin";

/** Only these roles may read or settle franchise payouts. */
export const PAYOUT_ADMIN_ROLES = ["superAdmin", "seniorManager", "superFranchiseAdmin"];

/**
 * Admin identity comes from the `adminEmail` param and is verified against the
 * Admin collection — the panel itself only keeps role/email in localStorage.
 *
 * Lives here rather than in the route so the payout route and its /invoice
 * child can share it: importing one route.js from another made Next fail to
 * emit the parent route at all.
 */
export async function assertPayoutAdmin(email) {
  if (!email) {
    return { ok: false, status: 401, message: "Admin email is required" };
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase() })
    .select("fullName email role")
    .lean();

  if (!admin) {
    return { ok: false, status: 401, message: "Admin not found" };
  }

  if (!PAYOUT_ADMIN_ROLES.includes(admin.role)) {
    return {
      ok: false,
      status: 403,
      message: "Only super admin can manage franchise payouts",
    };
  }

  return { ok: true, admin };
}
