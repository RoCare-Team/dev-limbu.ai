import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/user-agent
 *
 * Agent dropdowns (filter + lead assign) ke liye list.
 * Default me sirf ACTIVE agents aate hain — deactivate kiye gaye agent ki id
 * dropdown me nahi dikhni chahiye.
 *
 * ?includeInactive=1  → purani behaviour (sab agents, inactive bhi)
 */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "1";

    const query = { role: "agent" };
    if (!includeInactive) {
      // Purane docs me isActive field nahi hai → unhe active hi maano.
      query.isActive = { $ne: false };
    }

    const admins = await Admin.find(query)
      .select("fullName email _id mobile role isActive leadsEnabled")
      .sort({ fullName: 1 })
      .lean();

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}
