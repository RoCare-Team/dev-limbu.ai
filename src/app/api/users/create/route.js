import Admin from "@/models/Admin";
import { ROLE_DEFAULT_ACCESS, canManageRole, sanitizeAccess } from "@/lib/adminAccess";
import dbConnect from "@/lib/dbConnect";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

const ROLE_PRESETS = {
  superAdmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: true,
    seeAnalytics: true,
  },
  seniorManager: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: true,
    seeAnalytics: true,
  },
  franchiseAdmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: true,
    seeAnalytics: false,
  },
  admin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: true,
  },
  subadmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  manager: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  agent: {
    manageUsers: true,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  support: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
};

export async function POST(req) {
  try {
    await dbConnect();

    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let creator;
    try {
      creator = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const allowed =
      creator.role === "superAdmin" ||
      creator.role === "seniorManager" ||
      creator.role === "admin" ||
      creator.role === "franchiseAdmin" ||
      (creator.role === "subadmin" && creator.permissions?.manageUsers);

    if (!allowed) {
      return NextResponse.json({ message: "No permission" }, { status: 403 });
    }

    const { fullName, email, password, role, access } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    if (!canManageRole(creator.role, role)) {
      return NextResponse.json({ message: "Only a superAdmin can create a superAdmin" }, { status: 403 });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      plainPassword: password,
      role,
      permissions: ROLE_PRESETS[role] || {},
      // What the creator ticked section-wise; falls back to the role's default
      // list so a user is never created with no menu at all.
      access: sanitizeAccess(access).length
        ? sanitizeAccess(access)
        : ROLE_DEFAULT_ACCESS[role] || [],
      managerId: creator.id,
      franchiseId: creator.franchiseId || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Create User Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let updater;
    try {
      updater = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const targetUser = await Admin.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 🔒 Permission Check
    const allowed =
      updater.role === "superAdmin" ||
      updater.role === "seniorManager" ||
      updater.role === "admin" ||
      (updater.role === "franchiseAdmin" &&
        targetUser.franchiseId?.toString() === updater.franchiseId);

    if (!allowed) {
      return NextResponse.json(
        { message: "No permission to update user" },
        { status: 403 }
      );
    }

    if (
      !canManageRole(updater.role, targetUser.role) ||
      (body.role && !canManageRole(updater.role, body.role))
    ) {
      return NextResponse.json(
        { message: "Only a superAdmin can edit or create a superAdmin" },
        { status: 403 }
      );
    }

    // Only the fields the User Management screen edits — never managerId,
    // franchiseId or other ownership fields from a request body.
    const EDITABLE = ["fullName", "email", "mobile", "role", "password", "access", "isActive", "leadsEnabled"];
    for (const k of Object.keys(body)) {
      if (!EDITABLE.includes(k)) delete body[k];
    }

    if (body.email) {
      body.email = String(body.email).trim().toLowerCase();
      const taken = await Admin.exists({ email: body.email, _id: { $ne: id } });
      if (taken) {
        return NextResponse.json({ message: "Email already exists" }, { status: 409 });
      }
    }

    // If password updating → rehash (and keep the admin-visible copy in sync)
    if (body.password) {
      body.plainPassword = body.password;
      body.password = await bcrypt.hash(body.password, 10);
    }

    // If role updating → auto assign the coarse permissions. The section-wise
    // `access` is only replaced when the caller actually sends a new list.
    if (body.role) {
      body.permissions = ROLE_PRESETS[body.role] || {};
    }
    if ("access" in body) {
      const clean = sanitizeAccess(body.access);
      body.access = clean.length ? clean : ROLE_DEFAULT_ACCESS[body.role || targetUser.role] || [];
    }

    const updatedUser = await Admin.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Update User Error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(req) {
  try {
    await dbConnect();

    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let deleter;
    try {
      deleter = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 }
      );
    }

    if (deleter.id === id) {
      return NextResponse.json(
        { message: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    const targetUser = await Admin.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 🔒 Permission Check
    const allowed =
      deleter.role === "superAdmin" ||
      deleter.role === "seniorManager" ||
      deleter.role === "admin" ||
      (deleter.role === "franchiseAdmin" &&
        targetUser.franchiseId?.toString() === deleter.franchiseId);

    if (!allowed || !canManageRole(deleter.role, targetUser.role)) {
      return NextResponse.json(
        { message: "No permission to delete user" },
        { status: 403 }
      );
    }

    await Admin.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (err) {
    console.error("Delete User Error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}