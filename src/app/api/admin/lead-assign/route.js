import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

export async function POST(req) {
  try {
    await dbConnect();

    const { agentId, limit } = await req.json();

    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return NextResponse.json(
        { success: false, error: "Valid agentId required" },
        { status: 400 }
      );
    }

    if (!limit || typeof limit !== "number") {
      return NextResponse.json(
        { success: false, error: "Valid limit required" },
        { status: 400 }
      );
    }

    // optional: check agent exists
    const agentExists = await Admin.findOne({
      _id: agentId,
      role: "agent",
    });

    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // get unassigned users
    const users = await User.find({
      assignedAgentId: { $exists: false },
    }).limit(limit);

    if (!users.length) {
      return NextResponse.json({
        success: true,
        message: "No unassigned users found",
      });
    }

    // assign users
    for (const user of users) {
      user.assignedAgentId = agentId;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Users assigned successfully",
      assignedCount: users.length,
      agentId,
    });
  } catch (error) {
    console.error("Manual assign error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
