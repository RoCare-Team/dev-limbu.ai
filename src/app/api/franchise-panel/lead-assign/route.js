import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchiseTeam from "@/models/FranchiseTeam";
import { decodeFranchiseToken } from "@/lib/franchiseAuthServer";
import { userBelongsToFranchise } from "@/lib/franchiseLeadsQuery";

/**
 * Bulk-reassign selected leads to a team member (or unassign them).
 *
 * Writes the same fields the per-row dropdown does, so the two paths stay
 * consistent, and keeps each team member's assignedLeads list in sync.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const decoded = decodeFranchiseToken(req);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Agents may not hand their leads to someone else.
    if (decoded.type === "franchiseTeam") {
      return NextResponse.json(
        { success: false, message: "Only franchise admin can reassign leads" },
        { status: 403 },
      );
    }

    const franchiseCode = decoded.franchiseCode;
    const { userIds, assignedAgentId } = await req.json();

    const validIds = (Array.isArray(userIds) ? userIds : []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (!validIds.length) {
      return NextResponse.json(
        { success: false, message: "Select at least one lead" },
        { status: 400 },
      );
    }

    // Empty / null assignedAgentId means unassign.
    let teamMember = null;
    if (assignedAgentId) {
      if (!mongoose.Types.ObjectId.isValid(assignedAgentId)) {
        return NextResponse.json(
          { success: false, message: "Invalid team member" },
          { status: 400 },
        );
      }

      teamMember = await FranchiseTeam.findOne({
        _id: assignedAgentId,
        franchiseId: franchiseCode,
        isActive: true,
      })
        .select("fullName")
        .lean();

      if (!teamMember) {
        return NextResponse.json(
          { success: false, message: "Active team member not found" },
          { status: 404 },
        );
      }
    }

    const users = await User.find({ _id: { $in: validIds } });

    const movable = users.filter((user) =>
      userBelongsToFranchise(user, franchiseCode),
    );

    if (!movable.length) {
      return NextResponse.json(
        { success: false, message: "No leads found for your franchise" },
        { status: 404 },
      );
    }

    const previousAssignees = new Set();
    movable.forEach((user) => {
      const previous = user.referredByAgentId || user.assignedAgentId;
      if (previous) previousAssignees.add(String(previous));
    });

    const movableIds = movable.map((user) => user._id);

    await User.updateMany(
      { _id: { $in: movableIds } },
      {
        $set: {
          assignedAgentId: teamMember?._id || null,
          referredByAgentId: teamMember?._id || null,
          referredByAgentName: teamMember?.fullName || null,
        },
      },
    );

    // Pull from previous owners first, then push to the new one.
    for (const previousId of previousAssignees) {
      if (teamMember && String(teamMember._id) === previousId) continue;
      await FranchiseTeam.findByIdAndUpdate(previousId, {
        $pull: { assignedLeads: { $in: movableIds } },
      });
    }

    if (teamMember?._id) {
      await FranchiseTeam.findByIdAndUpdate(teamMember._id, {
        $addToSet: { assignedLeads: { $each: movableIds } },
      });
    }

    const skipped = users.length - movable.length;

    return NextResponse.json({
      success: true,
      message: teamMember
        ? `${movable.length} lead${movable.length === 1 ? "" : "s"} assigned to ${teamMember.fullName}`
        : `${movable.length} lead${movable.length === 1 ? "" : "s"} unassigned`,
      reassigned: movable.length,
      skipped,
      assignedAgentId: teamMember?._id || null,
      assignedAgentName: teamMember?.fullName || null,
    });
  } catch (error) {
    console.error("Lead reassign error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
