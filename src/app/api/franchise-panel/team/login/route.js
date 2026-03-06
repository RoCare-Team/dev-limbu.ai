import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import FranchiseTeam from "@/models/FranchiseTeam";
import FranchisePanel from "@/models/franchisePanel";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find team member by email
    const teamMember = await FranchiseTeam.findOne({ email: email.toLowerCase() });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if team member is active
    if (!teamMember.isActive) {
      return NextResponse.json(
        { success: false, message: "Account is inactive. Contact your administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, teamMember.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get franchise details
    const franchise = await FranchisePanel.findOne({ franchiseCode: teamMember.franchiseId });
    
    // Update login stats
    teamMember.lastLogin = new Date();
    teamMember.loginCount = (teamMember.loginCount || 0) + 1;
    await teamMember.save();

    // Generate token
    const token = jwt.sign(
      {
        id: teamMember._id,
        role: teamMember.role,
        franchiseId: teamMember.franchiseId,
        permissions: teamMember.permissions,
        email: teamMember.email,
        type: "franchiseTeam",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: teamMember._id,
        fullName: teamMember.fullName,
        email: teamMember.email,
        mobile: teamMember.mobile,
        role: teamMember.role,
        permissions: teamMember.permissions,
        franchiseId: teamMember.franchiseId,
        franchiseName: franchise?.franchiseName || "Franchise",
      },
    });
  } catch (error) {
    console.error("Team Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
