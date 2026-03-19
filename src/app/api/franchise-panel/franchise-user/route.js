import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose"

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const referCode = searchParams.get("referCode");

    if (!referCode) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
      });
    }

    const total = await User.countDocuments({ referCode });

    const users = await User.find({ referCode })
      .select("fullName email phone referCode createdAt leadStage wallet remarksHistory") // ✅ FIX
      .sort({ createdAt: -1 });

    const totalCoinsData = await User.aggregate([
      { $match: { referCode } },
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