import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

export async function POST(req) {
  try {
    await dbConnect();
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields required" },
        { status: 400 }
      );
    }

    const existing = await FranchisePanel.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const franchise = await FranchisePanel.create({
      fullName,
      email,
      password: hashedPassword,
      plainPassword: password,
    });

    return NextResponse.json({
      success: true,
      message: "Franchise created",
      franchise,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
