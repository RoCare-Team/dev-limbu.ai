import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { email, phone, fullName, gstNumber, source, planDuration } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // 1. Check if user already exists (by Email or Phone)
    // This prevents the "E11000 duplicate key error"
    let user = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ].filter(condition => condition.email || condition.phone) 
    });

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Existing user found",
        userId: user.userId,
        user
      });
    }

    // 2. Prepare Data for New User
    const userId = `USR${Date.now()}`;
    
    // Simple Date Calculation (Optional, but helps track when plan was selected)
    let packageStartDate = new Date();
    let packageExpiryDate = new Date();
    if (planDuration) {
      const duration = planDuration.toLowerCase();
      if (duration.includes("month")) packageExpiryDate.setMonth(packageExpiryDate.getMonth() + 1);
      else if (duration.includes("quarter")) packageExpiryDate.setMonth(packageExpiryDate.getMonth() + 3);
      else if (duration.includes("year")) packageExpiryDate.setFullYear(packageExpiryDate.getFullYear() + 1);
    }

    // 3. Create User (No Round Robin, No Wallet logic)
    const newUserPayload = {
      userId,
      fullName,
      email,
      phone,
      GstNumber: gstNumber,
      source: source || "website",
      planDuration,
      packageStartDate,
      packageExpiryDate,
      leadStage: "Active", // Default stage
    };

    const newUser = await User.create(newUserPayload);

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: newUser.userId,
      user: newUser
    });

  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "User with this Email/Phone already exists." }, { status: 400 });
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}