import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";

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

    // First check if it's a franchise admin
    const franchise = await FranchisePanel.findOne({ email: email.toLowerCase() });

    if (franchise) {
      // Franchise admin login
      if (!franchise.isActive) {
        return NextResponse.json(
          { success: false, message: "Account is inactive" },
          { status: 403 }
        );
      }

      const isMatch = await bcrypt.compare(password, franchise.password);

      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        {
          id: franchise._id,
          role: franchise.role,
          franchiseCode: franchise.franchiseCode,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({
        success: true,
        message: "Franchise login successful",
        token,
        user: {
          id: franchise._id,
          franchiseName: franchise.franchiseName,
          ownerName: franchise.ownerName,
          email: franchise.email,
          mobileNumber: franchise.mobileNumber,
          franchiseCode: franchise.franchiseCode,
          role: franchise.role,
        },
      });
    }

    // Check if it's a team member
    const teamMember = await FranchiseTeam.findOne({ email: email.toLowerCase() });

    if (teamMember) {
      // Team member login
      if (!teamMember.isActive) {
        return NextResponse.json(
          { success: false, message: "Account is inactive. Contact your administrator." },
          { status: 403 }
        );
      }

      const isMatch = await bcrypt.compare(password, teamMember.password);

      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid email or password" },
          { status: 401 }
        );
      }

      const franchise = await FranchisePanel.findOne({
        franchiseCode: teamMember.franchiseId,
      }).lean();

      // Update login stats
      teamMember.lastLogin = new Date();
      teamMember.loginCount = (teamMember.loginCount || 0) + 1;
      await teamMember.save();

      const token = jwt.sign(
        {
          id: teamMember._id,
          role: teamMember.role,
          franchiseCode: teamMember.franchiseId,
          permissions: teamMember.permissions,
          email: teamMember.email,
          type: "franchiseTeam",
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({
        success: true,
        message: "Team login successful",
        token,
        user: {
          id: teamMember._id,
          fullName: teamMember.fullName,
          email: teamMember.email,
          mobile: teamMember.mobile,
          role: teamMember.role,
          referralCode: teamMember.referralCode,
          agentReferralCode: teamMember.referralCode,
          permissions: teamMember.permissions,
          franchiseId: teamMember.franchiseId,
          franchiseCode: teamMember.franchiseId,
          franchiseName: franchise?.franchiseName || "Franchise",
        },
      });
    }

    // No user found
    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Franchise Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
