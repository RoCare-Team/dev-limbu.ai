import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";

function decodeFranchiseToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const decoded = decodeFranchiseToken(req);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword?.trim()) {
      return NextResponse.json(
        { success: false, message: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters" },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword.trim()) {
      return NextResponse.json(
        { success: false, message: "New password must be different from current password" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    if (decoded.type === "franchiseTeam") {
      const teamMember = await FranchiseTeam.findById(decoded.id);
      if (!teamMember) {
        return NextResponse.json(
          { success: false, message: "Account not found" },
          { status: 404 },
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, teamMember.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 401 },
        );
      }

      teamMember.password = hashedPassword;
      await teamMember.save();

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    const franchise = await FranchisePanel.findById(decoded.id);
    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 },
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, franchise.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 },
      );
    }

    franchise.password = hashedPassword;
    franchise.plainPassword = newPassword.trim();
    await franchise.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Franchise change password error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
