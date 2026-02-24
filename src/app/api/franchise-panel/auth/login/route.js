import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
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

    const franchise = await FranchisePanel.findOne({ email });

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

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
  } catch (error) {
    console.error("Franchise Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
