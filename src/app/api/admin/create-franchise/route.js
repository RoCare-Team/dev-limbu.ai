import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password, fullName } = await req.json();

    // Check if already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "Franchise admin already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create franchise admin
    const admin = await Admin.create({
      email,
      fullName,
      password: hashedPassword,
      role: "franchiseAdmin",
    //   franchiseId: franchiseId || null,
    });

    return NextResponse.json({
      message: "Franchise Admin created successfully",
      adminId: admin._id,
    });

  } catch (err) {
    console.error("Create franchise admin error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
