import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  buildFranchiseLeadsFilter,
  escapeRegex,
  userBelongsToFranchise,
} from "@/lib/franchiseLeadsQuery";

function decodeFranchiseToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

async function getRoundRobinTeamMember(franchiseCode) {
  const teamMembers = await FranchiseTeam.find({
    franchiseId: franchiseCode,
    isActive: true,
    role: { $in: ["agent", "manager", "superFranchiseAdmin"] },
  })
    .select("fullName email assignedLeads createdAt")
    .lean();

  if (!teamMembers.length) return null;

  return teamMembers.sort((a, b) => {
    const aCount = Array.isArray(a.assignedLeads) ? a.assignedLeads.length : 0;
    const bCount = Array.isArray(b.assignedLeads) ? b.assignedLeads.length : 0;
    if (aCount !== bCount) return aCount - bCount;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  })[0];
}

export async function GET(req) {
  try {
    await dbConnect();
    const decoded = decodeFranchiseToken(req);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const referCode = searchParams.get("referCode");

    if (userId) {
      const user = mongoose.Types.ObjectId.isValid(userId)
        ? await User.findById(userId)
            .select(
              "fullName email phone referCode franchiseId createdAt leadStage leadStatus wallet remarksHistory userId source leadTags referredByAgentId referredByAgentName assignedAgentId subscription isBusinessConnected selectedBusiness chatbotMessageCount",
            )
            .lean()
        : await User.findOne({ userId })
            .select(
              "fullName email phone referCode franchiseId createdAt leadStage leadStatus wallet remarksHistory userId source leadTags referredByAgentId referredByAgentName assignedAgentId subscription isBusinessConnected selectedBusiness chatbotMessageCount",
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

      if (
        decoded?.type === "franchiseTeam" &&
        String(user.referredByAgentId || user.assignedAgentId || "") !==
          String(decoded.id)
      ) {
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

    const scopedFilter =
      decoded?.type === "franchiseTeam"
        ? {
            $and: [
              franchiseFilter,
              {
                $or: [
                  { referredByAgentId: new mongoose.Types.ObjectId(decoded.id) },
                  { assignedAgentId: new mongoose.Types.ObjectId(decoded.id) },
                ],
              },
            ],
          }
        : franchiseFilter;

    const total = await User.countDocuments(scopedFilter);

    const users = await User.find(scopedFilter)
      .select(
        "fullName email phone referCode franchiseId createdAt leadStage leadStatus wallet remarksHistory userId source leadTags referredByAgentId referredByAgentName assignedAgentId subscription isBusinessConnected selectedBusiness chatbotMessageCount",
      )
      .sort({ createdAt: -1 });

    const totalCoinsData = await User.aggregate([
      { $match: scopedFilter },
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

    const { fullName, email, phone, referCode, leadStatus, source } =
  await req.json();

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
    const planName = "";
    const franchiseCode = franchise.franchiseCode;
    const assignedMember = await getRoundRobinTeamMember(franchiseCode);

    const user = await User.create({
      userId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      referCode: franchiseCode,
      franchiseId: franchiseCode,
      assignedAgentId: assignedMember?._id,
      referredByAgentId: assignedMember?._id,
      referredByAgentName: assignedMember?.fullName || null,
      leadTags: ["franchise-panel"],
      wallet: 500,
      freeUsedCount: 2,
      leadStage: "Active",
      leadStatus: ["Hot", "Warm", "Cold"].includes(leadStatus)
        ? leadStatus
        : "",
      source: source || "manual-upload",
      subscription: {
        plan: planName,
        status: planName === "Free" ? "inactive" : "active",
        date: new Date(),
      },
    });

    if (assignedMember?._id) {
      await FranchiseTeam.findByIdAndUpdate(assignedMember._id, {
        $addToSet: { assignedLeads: user._id },
      });
    }

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
    const {
      userId,
      remark,
      remarkId,
      action,
      leadStage,
      leadStatus,
      assignedAgentId,
    } = body;

    await dbConnect();
    const decoded = decodeFranchiseToken(req);

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ success: false });
    }

    if (
      decoded?.type === "franchiseTeam" &&
      String(user.referredByAgentId || user.assignedAgentId || "") !==
        String(decoded.id)
    ) {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 },
      );
    }

    if (leadStage) {
      const allowedStages = ["Active", "Follow Up", "Inactive", "Onboard"];
      if (!allowedStages.includes(leadStage)) {
        return NextResponse.json(
          { success: false, message: "Invalid lead stage" },
          { status: 400 },
        );
      }
      user.leadStage = leadStage;
    }

    if (leadStatus !== undefined) {
      const allowedStatuses = ["Hot", "Warm", "Cold", ""];
      if (!allowedStatuses.includes(leadStatus)) {
        return NextResponse.json(
          { success: false, message: "Invalid lead status" },
          { status: 400 },
        );
      }
      user.leadStatus = leadStatus;
    }

    if (assignedAgentId !== undefined) {
      const previousAssignee = user.referredByAgentId || user.assignedAgentId;

      if (assignedAgentId) {
        if (!mongoose.Types.ObjectId.isValid(assignedAgentId)) {
          return NextResponse.json(
            { success: false, message: "Invalid team member" },
            { status: 400 },
          );
        }

        const teamMember = await FranchiseTeam.findOne({
          _id: assignedAgentId,
          franchiseId: user.franchiseId || user.referCode,
          isActive: true,
        }).lean();

        if (!teamMember) {
          return NextResponse.json(
            { success: false, message: "Active team member not found" },
            { status: 404 },
          );
        }

        user.assignedAgentId = teamMember._id;
        user.referredByAgentId = teamMember._id;
        user.referredByAgentName = teamMember.fullName;

        await FranchiseTeam.findByIdAndUpdate(teamMember._id, {
          $addToSet: { assignedLeads: user._id },
        });
      } else {
        user.assignedAgentId = null;
        user.referredByAgentId = null;
        user.referredByAgentName = null;
      }

      if (previousAssignee && String(previousAssignee) !== assignedAgentId) {
        await FranchiseTeam.findByIdAndUpdate(previousAssignee, {
          $pull: { assignedLeads: user._id },
        });
      }
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
      {
        remarksHistory: user.remarksHistory,
        leadStage: user.leadStage,
        leadStatus: user.leadStatus,
        assignedAgentId: user.assignedAgentId,
        referredByAgentId: user.referredByAgentId,
        referredByAgentName: user.referredByAgentName,
      },
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
