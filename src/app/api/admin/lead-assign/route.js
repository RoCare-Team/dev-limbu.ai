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

    const EXCLUDED_AGENT_ID = "69737cd544c63ceb679410a3";
    const TARGET_AGENT_ID = "699c100f90278fadff8f8aa9";

    const excludedObjectId = new mongoose.Types.ObjectId(EXCLUDED_AGENT_ID);
    const targetObjectId = new mongoose.Types.ObjectId(TARGET_AGENT_ID);

    // ✅ Make sure target agent exists
    const agentExists = await Admin.findOne({
      _id: targetObjectId,
      role: "agent",
    });

    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: "Target agent not found" },
        { status: 404 }
      );
    }

    // ✅ Bulk update
    const result = await User.updateMany(
      {
        assignedAgentId: {
          $ne: excludedObjectId, // don't touch this agent
        },
      },
      {
        $set: {
          assignedAgentId: targetObjectId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Bulk agent replacement completed",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}