import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

function generateCode(name, count) {
  const prefix = name.replace(/\s+/g, "").substring(0, 5).toUpperCase();
  const number = String(count).padStart(3, "0");
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
    } = await req.json();

    // ✅ Validation
    if (
      !franchiseName ||
      !ownerName ||
      !mobileNumber ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Check duplicate email or mobile
    const existing = await FranchisePanel.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Franchise already exists" },
        { status: 409 }
      );
    }

    // ✅ Generate franchise code
    const total = await FranchisePanel.countDocuments();
    const franchiseCode = generateCode(franchiseName, total + 1);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newFranchise = await FranchisePanel.create({
      franchiseName,
      ownerName,
      mobileNumber,
      email,
      password: hashedPassword,
      franchiseCode,
    });

    return NextResponse.json({
      success: true,
      message: "Franchise created successfully",
      data: {
        id: newFranchise._id,
        franchiseCode: newFranchise.franchiseCode,
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
