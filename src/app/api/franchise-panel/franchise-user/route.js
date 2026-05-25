import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchisePanel from "@/models/franchisePanel";
import mongoose from "mongoose";
import {
  buildFranchiseLeadsFilter,
  escapeRegex,
  userBelongsToFranchise,
} from "@/lib/franchiseLeadsQuery";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const referCode = searchParams.get("referCode");

    if (userId) {
      const user = mongoose.Types.ObjectId.isValid(userId)
        ? await User.findById(userId)
            .select(
              "fullName email phone referCode createdAt leadStage wallet remarksHistory userId",
            )
            .lean()
        : await User.findOne({ userId })
            .select(
              "fullName email phone referCode createdAt leadStage wallet remarksHistory userId",
            )
            .lean();

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }

      const scopeCode = referCode || user.franchiseId || user.referCode;
      if (scopeCode && !userBelongsToFranchise(user, scopeCode)) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, user });
    }

    if (!referCode) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
      });
    }

    const code = referCode.trim();
    const franchiseFilter = buildFranchiseLeadsFilter(code);
    if (!franchiseFilter) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
      });
    }

    const franchiseExists = await FranchisePanel.findOne({
      franchiseCode: { $regex: new RegExp(`^${escapeRegex(code)}$`, "i") },
      isActive: true,
    }).lean();

    if (!franchiseExists) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
        totalCoins: 0,
      });
    }

    const total = await User.countDocuments(franchiseFilter);

    const users = await User.find(franchiseFilter)
      .select(
        "fullName email phone referCode franchiseId createdAt leadStage wallet remarksHistory source leadTags",
      )
      .sort({ createdAt: -1 });

    const totalCoinsData = await User.aggregate([
      { $match: franchiseFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$wallet" }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      total,
      users,
      totalCoins: totalCoinsData[0]?.total || 0
    });

  } catch (error) {
    console.error("Franchise users API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const { fullName, email, phone, referCode, plan } = await req.json();

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name and email are required" },
        { status: 400 },
      );
    }

    if (!referCode?.trim()) {
      return NextResponse.json(
        { success: false, error: "Franchise refer code is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const code = referCode.trim();
    const franchise = await FranchisePanel.findOne({
      franchiseCode: { $regex: new RegExp(`^${escapeRegex(code)}$`, "i") },
      isActive: true,
    }).lean();

    if (!franchise) {
      return NextResponse.json(
        { success: false, error: "Invalid franchise code" },
        { status: 400 },
      );
    }

    const userId = `USR${Date.now()}`;
    const planName = plan || "Basic";
    const franchiseCode = franchise.franchiseCode;

    const user = await User.create({
      userId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      referCode: franchiseCode,
      franchiseId: franchiseCode,
      leadTags: ["franchise-panel"],
      wallet: 500,
      freeUsedCount: 2,
      leadStage: "Active",
      source: "manual-upload",
      subscription: {
        plan: planName,
        status: planName === "Free" ? "inactive" : "active",
        date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      user,
    });
  } catch (error) {
    console.error("Franchise add lead error:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Email or phone already in use" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { userId, remark, remarkId, action } = body;

    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ success: false });
    }

    // ADD
    if (action !== "delete" && remark) {
      user.remarksHistory.push({
        text: remark,
        createdAt: new Date(),
      });
    }

    // DELETE
    if (action === "delete" && remarkId) {
      user.remarksHistory = user.remarksHistory.filter(
        (r) => r._id.toString() !== remarkId.toString()
      );
    }

    // 🔥 SAFE UPDATE
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { remarksHistory: user.remarksHistory },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.log("API ERROR:", error);
    return NextResponse.json({ success: false });
  }
}