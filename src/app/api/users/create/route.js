import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

const ROLE_PRESETS = {
  superAdmin: {
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
      creator.role === "admin" ||
      creator.role === "franchiseAdmin" ||
      (creator.role === "subadmin" && creator.permissions?.manageUsers);

    if (!allowed) {
      return NextResponse.json({ message: "No permission" }, { status: 403 });
    }

    const { fullName, email, password, role } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    await Admin.create({
      fullName,
      email,
      password,
      role,
      permissions: ROLE_PRESETS[role] || {},
      managerId: creator.id,
      franchiseId: creator.franchiseId || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Create User Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
