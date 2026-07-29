import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { isFranchiseAgent } from "@/lib/franchiseAuth";
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

function canAccessLead(decoded, user) {
  if (!decoded || !user) return false;

  const franchiseCode = decoded.franchiseCode;
  if (!franchiseCode || !userBelongsToFranchise(user, franchiseCode)) {
    return false;
  }

  if (decoded.type === "franchiseTeam") {
    return (
      String(user.referredByAgentId || user.assignedAgentId || "") ===
      String(decoded.id)
    );
  }

  return true;
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

    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25),
    );
    const skip = (page - 1) * limit;

    // ── Optional filters ────────────────────────────────────────
    const leadStage = (searchParams.get("leadStage") || "").trim();
    const leadStatus = (searchParams.get("leadStatus") || "").trim();
    const source = (searchParams.get("source") || "").trim();
    const assignedAgentId = (searchParams.get("assignedAgentId") || "").trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Everything except the stage filter — stat cards stay a full breakdown
    // even while the table is narrowed down to a single stage.
    const statsConditions = [scopedFilter];

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      statsConditions.push({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { referCode: searchRegex },
          { referredByAgentName: searchRegex },
          { leadStatus: searchRegex },
          { source: searchRegex },
        ],
      });
    }

    const createdAtRange = {};
    if (startDate && !Number.isNaN(new Date(startDate).getTime())) {
      createdAtRange.$gte = new Date(startDate);
    }
    if (endDate && !Number.isNaN(new Date(endDate).getTime())) {
      createdAtRange.$lte = new Date(endDate);
    }
    if (Object.keys(createdAtRange).length) {
      statsConditions.push({ createdAt: createdAtRange });
    }

    if (leadStatus) {
      if (leadStatus === "Untagged") {
        statsConditions.push({
          $or: [
            { leadStatus: "" },
            { leadStatus: null },
            { leadStatus: { $exists: false } },
          ],
        });
      } else if (["Hot", "Warm", "Cold"].includes(leadStatus)) {
        statsConditions.push({ leadStatus });
      }
    }

    if (source) {
      statsConditions.push({
        source: { $regex: new RegExp(`^${escapeRegex(source)}$`, "i") },
      });
    }

    if (assignedAgentId) {
      if (assignedAgentId === "unassigned") {
        statsConditions.push({
          $and: [
            {
              $or: [
                { referredByAgentId: null },
                { referredByAgentId: { $exists: false } },
              ],
            },
            {
              $or: [
                { assignedAgentId: null },
                { assignedAgentId: { $exists: false } },
              ],
            },
          ],
        });
      } else if (mongoose.Types.ObjectId.isValid(assignedAgentId)) {
        const agentObjectId = new mongoose.Types.ObjectId(assignedAgentId);
        statsConditions.push({
          $or: [
            { referredByAgentId: agentObjectId },
            { assignedAgentId: agentObjectId },
          ],
        });
      }
    }

    const statsFilter =
      statsConditions.length === 1 ? scopedFilter : { $and: statsConditions };

    const allowedStages = ["Active", "Follow Up", "Inactive", "Onboard"];
    const finalFilter = allowedStages.includes(leadStage)
      ? { $and: [...statsConditions, { leadStage }] }
      : statsFilter;

    const total = await User.countDocuments(finalFilter);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const statsAgg = await User.aggregate([
      { $match: statsFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$leadStage", "Active"] }, 1, 0] },
          },
          followUpUsers: {
            $sum: { $cond: [{ $eq: ["$leadStage", "Follow Up"] }, 1, 0] },
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$leadStage", "Inactive"] }, 1, 0] },
          },
          onboardUsers: {
            $sum: { $cond: [{ $eq: ["$leadStage", "Onboard"] }, 1, 0] },
          },
          usersToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", todayStart] },
                    { $lte: ["$createdAt", todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalCoins: { $sum: "$wallet" },
        },
      },
    ]);

    const statsRow = statsAgg[0] || {};

    const users = await User.find(finalFilter)
      .select(
        "fullName email phone referCode franchiseId createdAt leadStage leadStatus wallet remarksHistory userId source leadTags referredByAgentId referredByAgentName assignedAgentId subscription isBusinessConnected selectedBusiness chatbotMessageCount",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Dropdown options — always the full franchise scope so the list of
    // choices does not shrink as filters are applied.
    const sources = (await User.distinct("source", scopedFilter))
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      users,
      sources,
      totalCoins: statsRow.totalCoins || 0,
      stats: {
        totalUsers: statsRow.totalUsers || 0,
        activeUsers: statsRow.activeUsers || 0,
        followUpUsers: statsRow.followUpUsers || 0,
        inactiveUsers: statsRow.inactiveUsers || 0,
        onboardUsers: statsRow.onboardUsers || 0,
        usersToday: statsRow.usersToday || 0,
        totalPosts: 0,
      },
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
      fullName,
      email,
      phone,
      source,
    } = body;

    await dbConnect();
    const decoded = decodeFranchiseToken(req);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    if (!canAccessLead(decoded, user)) {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 },
      );
    }

    if (fullName?.trim()) {
      user.fullName = fullName.trim();
    }

    if (email?.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailTaken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).lean();

      if (emailTaken) {
        return NextResponse.json(
          { success: false, message: "Email already in use" },
          { status: 409 },
        );
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = phone?.trim() || undefined;
    }

    if (source) {
      user.source = source;
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
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        source: user.source,
        remarksHistory: user.remarksHistory,
        leadStage: user.leadStage,
        leadStatus: user.leadStatus,
        assignedAgentId: user.assignedAgentId,
        referredByAgentId: user.referredByAgentId,
        referredByAgentName: user.referredByAgentName,
      },
      { new: true },
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

export async function DELETE(req) {
  try {
    await dbConnect();

    const decoded = decodeFranchiseToken(req);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");
    let bodyUserId = null;

    try {
      const body = await req.json();
      bodyUserId = body?.userId;
    } catch {
      bodyUserId = null;
    }

    const userId = queryUserId || bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }

    const user = mongoose.Types.ObjectId.isValid(userId)
      ? await User.findById(userId)
      : await User.findOne({ userId });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (!canAccessLead(decoded, user)) {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 },
      );
    }

    const assigneeId = user.referredByAgentId || user.assignedAgentId;
    if (assigneeId) {
      await FranchiseTeam.findByIdAndUpdate(assigneeId, {
        $pull: { assignedLeads: user._id },
      });
    }

    await User.findByIdAndDelete(user._id);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Franchise delete lead error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const decoded = decodeFranchiseToken(req);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    if (isFranchiseAgent(decoded.role)) {
      return NextResponse.json(
        { success: false, message: "Agents cannot update wallet" },
        { status: 403 },
      );
    }

    const { userId, amount, type, reason } = await req.json();

    if (!userId || amount == null || !type) {
      return NextResponse.json(
        { success: false, message: "userId, amount and type are required" },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid amount" },
        { status: 400 },
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, message: "Reason is required" },
        { status: 400 },
      );
    }

    const user = mongoose.Types.ObjectId.isValid(userId)
      ? await User.findById(userId)
      : await User.findOne({ userId });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const franchiseCode = decoded.franchiseCode;
    if (!userBelongsToFranchise(user, franchiseCode)) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (
      decoded.type === "franchiseTeam" &&
      String(user.referredByAgentId || user.assignedAgentId || "") !==
        String(decoded.id)
    ) {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 },
      );
    }

    const isAdd = type === "add" || type === "credit";
    const isDeduct = type === "deduct" || type === "debit";

    if (!isAdd && !isDeduct) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction type" },
        { status: 400 },
      );
    }

    let updatedUser;

    if (isAdd) {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { wallet: parsedAmount } },
        { new: true, runValidators: false },
      );

      await Transaction.create({
        userId: user.userId,
        type: "credit",
        amount: parsedAmount,
        balanceAfter: updatedUser.wallet,
        reason: reason.trim(),
        metadata: {
          source: "franchise-panel",
          franchiseCode,
          updatedBy: decoded.email || decoded.id,
        },
      });
    } else {
      if ((user.wallet || 0) < parsedAmount) {
        return NextResponse.json(
          { success: false, message: "Insufficient balance" },
          { status: 400 },
        );
      }

      updatedUser = await User.findOneAndUpdate(
        { _id: user._id, wallet: { $gte: parsedAmount } },
        { $inc: { wallet: -parsedAmount } },
        { new: true, runValidators: false },
      );

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: "Insufficient balance" },
          { status: 400 },
        );
      }

      await Transaction.create({
        userId: user.userId,
        type: "debit",
        amount: parsedAmount,
        balanceAfter: updatedUser.wallet,
        reason: reason.trim(),
        metadata: {
          source: "franchise-panel",
          franchiseCode,
          updatedBy: decoded.email || decoded.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Wallet updated",
      wallet: updatedUser.wallet,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Franchise wallet update error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
