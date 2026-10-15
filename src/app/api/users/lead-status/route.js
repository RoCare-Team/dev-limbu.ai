import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

// Ye roles kisi bhi agent ka lead status badal sakte hain.
const ADMIN_ROLES = ["superAdmin", "seniorManager", "admin", "subadmin", "manager"];

function getAuthUser(req) {
  const auth = req.headers.get("authorization");
  if (!auth) return { error: "Unauthorized", status: 401 };

  try {
    return { user: jwt.verify(auth.split(" ")[1], JWT_SECRET) };
  } catch {
    return { error: "Invalid token", status: 401 };
  }
}

/**
 * GET /api/users/lead-status            → apna khud ka status (agent dashboard)
 * GET /api/users/lead-status?agentId=X  → kisi agent ka status (admin only)
 */
export async function GET(req) {
  try {
    const { user, error, status } = getAuthUser(req);
    if (error) return NextResponse.json({ success: false, message: error }, { status });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get("agentId");
    const targetId = requestedId || user.id;

    if (requestedId && requestedId !== user.id && !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "No permission" },
        { status: 403 }
      );
    }

    const agent = await Admin.findById(targetId)
      .select("fullName email role isActive leadsEnabled")
      .lean();

    if (!agent) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agentId: String(agent._id),
      fullName: agent.fullName,
      role: agent.role,
      isActive: agent.isActive !== false,
      // Field purane docs me nahi hai → default enabled
      leadsEnabled: agent.leadsEnabled !== false,
    });
  } catch (err) {
    console.error("Lead status GET error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/lead-status
 * Body: { leadsEnabled: boolean, agentId?: string }
 *
 * agentId chhod do to apna hi status update hota hai (agent khud on/off kar sake).
 * Doosre ka status sirf admin roles badal sakte hain.
 */
export async function PUT(req) {
  try {
    const { user, error, status } = getAuthUser(req);
    if (error) return NextResponse.json({ success: false, message: error }, { status });

    const body = await req.json().catch(() => ({}));

    if (typeof body.leadsEnabled !== "boolean") {
      return NextResponse.json(
        { success: false, message: "leadsEnabled (boolean) required" },
        { status: 400 }
      );
    }

    const targetId = body.agentId || user.id;
    const isSelf = String(targetId) === String(user.id);

    if (!isSelf && !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "No permission to update this user" },
        { status: 403 }
      );
    }

    await dbConnect();

    const updated = await Admin.findByIdAndUpdate(
      targetId,
      { $set: { leadsEnabled: body.leadsEnabled } },
      { new: true }
    )
      .select("fullName email role isActive leadsEnabled")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log(
      `[LeadAssign] ${updated.fullName || updated.email} → leads ${
        body.leadsEnabled ? "ENABLED" : "DISABLED"
      } (by ${user.id}${isSelf ? ", self" : ""})`
    );

    return NextResponse.json({
      success: true,
      message: body.leadsEnabled
        ? "Lead assignment enabled"
        : "Lead assignment disabled — is agent ko naye leads nahi jayenge",
      agentId: String(updated._id),
      leadsEnabled: updated.leadsEnabled !== false,
    });
  } catch (err) {
    console.error("Lead status PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
