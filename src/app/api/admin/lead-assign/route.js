import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

/* =====================================================
   POST → Bulk Assign / Reassign
===================================================== */
export async function POST(req) {
  try {
    await dbConnect();

    const { agentId, fromAgentId, limit } = await req.json();

    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return NextResponse.json(
        { success: false, error: "Valid agentId required" },
        { status: 400 }
      );
    }

    const toId = new mongoose.Types.ObjectId(agentId);

    const agentExists = await Admin.findOne({
      _id: toId,
      role: "agent",
    });

    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: "Target agent not found" },
        { status: 404 }
      );
    }

    /* ===============================
       CASE 1 → Reassign from agent
    =============================== */
    if (fromAgentId) {
      if (!mongoose.Types.ObjectId.isValid(fromAgentId)) {
        return NextResponse.json(
          { success: false, error: "Valid fromAgentId required" },
          { status: 400 }
        );
      }

      const fromId = new mongoose.Types.ObjectId(fromAgentId);
      let query = { assignedAgentId: fromId };

      // Limited transfer
      if (limit && typeof limit === "number") {
        const users = await User.find(query).limit(limit).select("_id");

        if (!users.length) {
          return NextResponse.json({
            success: true,
            message: "No leads found for this agent",
            modifiedCount: 0,
          });
        }

        const ids = users.map((u) => u._id);

        await User.updateMany(
          { _id: { $in: ids } },
          { $set: { assignedAgentId: toId } }
        );

        return NextResponse.json({
          success: true,
          message: "Limited leads reassigned successfully",
          modifiedCount: ids.length,
        });
      }

      // Transfer all
      const result = await User.updateMany(query, {
        $set: { assignedAgentId: toId },
      });

      return NextResponse.json({
        success: true,
        message: "All leads reassigned successfully",
        modifiedCount: result.modifiedCount,
      });
    }

    /* ===============================
       CASE 2 → Assign unassigned
    =============================== */
    if (!limit || typeof limit !== "number") {
      return NextResponse.json(
        { success: false, error: "Limit required for unassigned leads" },
        { status: 400 }
      );
    }

    const users = await User.find({
      $or: [
        { assignedAgentId: { $exists: false } },
        { assignedAgentId: null },
      ],
    })
      .limit(limit)
      .select("_id");

    if (!users.length) {
      return NextResponse.json({
        success: true,
        message: "No unassigned leads found",
        assignedCount: 0,
      });
    }

    const ids = users.map((u) => u._id);

    await User.updateMany(
      { _id: { $in: ids } },
      { $set: { assignedAgentId: toId } }
    );

    return NextResponse.json({
      success: true,
      message: "Unassigned leads assigned successfully",
      assignedCount: ids.length,
    });

  } catch (error) {
    console.error("POST lead assign error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* =====================================================
   PUT → Single Lead Update
===================================================== */
export async function PUT(req) {
  try {
    await dbConnect();

    const { userId, agentId } = await req.json();

    if (
      !userId ||
      !agentId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(agentId)
    ) {
      return NextResponse.json(
        { success: false, error: "Valid userId and agentId required" },
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const agentObjectId = new mongoose.Types.ObjectId(agentId);

    const agentExists = await Admin.findOne({
      _id: agentObjectId,
      role: "agent",
    });

    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userObjectId,
      { $set: { assignedAgentId: agentObjectId } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead agent updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("PUT lead assign error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}