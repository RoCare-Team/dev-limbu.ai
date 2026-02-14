import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

function generateCode(name, count) {
  const prefix = name.replace(/\s+/g, "").substring(0, 5).toUpperCase();
  const number = String(count).padStart(2, "0");
  return `${prefix}${number}`;
}

export async function POST(req) {
  try {
    await dbConnect();

    const {
      franchiseName,
      ownerName,
      mobileNumber,
      email,
      password,
      referredBy,
    } = await req.json();

    if (!franchiseName || !ownerName || !mobileNumber || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check existing mobile or email
    const exists = await FranchisePanel.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Franchise already exists" },
        { status: 409 }
      );
    }

    // Count existing franchises with same prefix
    const prefix = franchiseName.replace(/\s+/g, "").substring(0, 5).toUpperCase();
    const total = await FranchisePanel.countDocuments({
      franchiseCode: { $regex: `^${prefix}` },
    });

    const franchiseCode = generateCode(franchiseName, total + 1);

    const hashedPassword = await bcrypt.hash(password, 10);

    const franchise = await FranchisePanel.create({
      franchiseName,
      ownerName,
      mobileNumber,
      email,
      password: hashedPassword,
      franchiseCode,
      referredBy: referredBy || null,
    });

    return NextResponse.json({
      success: true,
      message: "Franchise created successfully",
      data: {
        id: franchise._id,
        franchiseCode: franchise.franchiseCode,
      },
    });
  } catch (error) {
    console.error("Create Franchise Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
