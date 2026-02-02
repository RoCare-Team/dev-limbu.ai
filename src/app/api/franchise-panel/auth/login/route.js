import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password, referCode } = await req.json();

    if (!email || !password || !referCode) {
      return NextResponse.json(
        { success: false, message: "Email, Password & Refer Code required" },
        { status: 400 }
      );
    }

    const user = await FranchisePanel.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account inactive" },
        { status: 403 }
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🔥 Validate Refer Code from EXISTING USERS
    const referUser = await FranchisePanel.findOne({ referCode });
    if (!referUser) {
      return NextResponse.json(
        { success: false, message: "Invalid referral code" },
        { status: 400 }
      );
    }

    // Save referral only once
    if (!user.referredBy) {
      user.referredBy = referUser._id;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        // referCode: user.referCode,
        referredBy: referUser.fullName,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
