import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserActivePlans, planGroupsOf } from "@/lib/userPlans";

/**
 * GET /api/users/plan-groups?userId=
 * The feature groups ("gmb", "social", …) the user's active plans unlock.
 * Small and fast: the login redirect and the dashboard route guard call it
 * (lib/planAccess.js). Same plan rules as the sidebar (lib/userPlans.js).
 */
export async function GET(req) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ success: true, planGroups: [] });

  try {
    await dbConnect();
    const user = await User.findOne({ userId }).select("userId subscription planPurchases").lean();
    if (!user) return NextResponse.json({ success: false, planGroups: [] }, { status: 404 });
    const planGroups = planGroupsOf(await getUserActivePlans(user));
    return NextResponse.json({ success: true, planGroups });
  } catch (err) {
    console.error("plan-groups error:", err);
    return NextResponse.json({ success: false, error: "Could not load plans" }, { status: 500 });
  }
}
