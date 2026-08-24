import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import FranchisePanel from "@/models/franchisePanel";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/** Only these admin roles may enter a franchise panel. */
const ALLOWED_ROLES = ["superAdmin", "admin"];

/**
 * Admin -> franchise impersonation.
 *
 * Mints a franchise-panel token for any franchise so an admin can open that
 * franchise's dashboard without knowing its password. The token carries the same
 * claims the real login issues (so the panel works unchanged) plus
 * `impersonated`/`impersonatedBy`, and expires in 2h instead of 7d.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let caller;
    try {
      caller = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(caller.role)) {
      return NextResponse.json(
        { success: false, message: "No permission to log in as a franchise" },
        { status: 403 }
      );
    }

    // The JWT role alone isn't enough — confirm the account still exists and is
    // active, so a revoked admin's old token can't be used to impersonate.
    const adminUser = await Admin.findById(caller.id).select("role isActive email");
    if (!adminUser || !adminUser.isActive || !ALLOWED_ROLES.includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, message: "Admin account is not allowed to do this" },
        { status: 403 }
      );
    }

    const { franchiseId } = await req.json();
    if (!franchiseId) {
      return NextResponse.json(
        { success: false, message: "franchiseId is required" },
        { status: 400 }
      );
    }

    const franchise = await FranchisePanel.findById(franchiseId);
    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 }
      );
    }

    const token = jwt.sign(
      {
        id: franchise._id,
        role: franchise.role,
        franchiseCode: franchise.franchiseCode,
        impersonated: true,
        impersonatedBy: adminUser.email || String(adminUser._id),
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    console.log(
      `[Impersonate] ${adminUser.email} -> franchise ${franchise.franchiseCode} (${franchise._id})`
    );

    return NextResponse.json({
      success: true,
      message: "Impersonation session created",
      token,
      user: {
        id: franchise._id,
        franchiseName: franchise.franchiseName,
        ownerName: franchise.ownerName,
        email: franchise.email,
        mobileNumber: franchise.mobileNumber,
        franchiseCode: franchise.franchiseCode,
        role: franchise.role,
        impersonated: true,
      },
    });
  } catch (error) {
    console.error("Franchise impersonate error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
