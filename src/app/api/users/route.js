import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import Admin from "@/models/Admin";
import {
  ALLOWED_USER_SOURCE_VALUES,
  mergeMetaLeadsTag,
} from "@/lib/bookingSource";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";
import { getAppDayBounds } from "@/lib/appDayBounds";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import {
  listUsersForChatbotChatDay,
  fetchLimbuBotAdminUsers,
} from "@/lib/limbuBotUserSync";
import { META_LEAD_TAG_KEYS } from "@/lib/metaFormLeadsConfig";

/** User.source values that count as Meta / instant-form leads (not site signup). */
const META_LEAD_SOURCES = [
  "Meta Lead",
  "Real estate leads",
  "bulk-upload",
  "manual-upload",
  "csv-import",
  "excel-import",
  "Meta Leads",
  "Meta",
];

function isMetaLeadSourceFilter(source) {
  const normalized = String(source || "")
    .trim()
    .toLowerCase();
  return [
    "meta",
    "meta leads",
    "meta lead",
    "metaleads",
    "meta-leads",
    "bulk-upload",
    "manual-upload",
    "csv-import",
    "excel-import",
  ].includes(normalized);
}

/** User.source values that count as real-estate leads. */
const REAL_ESTATE_LEAD_SOURCES = ["Real estate leads"];
/** Stored `User.leadTags` values that count as real-estate leads. */
const REAL_ESTATE_LEAD_TAG_KEYS = ["real-estate-lead"];

function isRealEstateLeadSourceFilter(source) {
  const normalized = String(source || "")
    .trim()
    .toLowerCase();
  return [
    "real estate leads",
    "real-estate leads",
    "real estate lead",
    "real-estate-lead",
    "real estate",
    "realestate",
  ].includes(normalized);
}

function getSourceMatch(source) {
  if (!source || source === "All") return null;

  if (isMetaLeadSourceFilter(source)) {
    return {
      $or: [
        { source: { $in: META_LEAD_SOURCES } },
        { leadTags: { $in: META_LEAD_TAG_KEYS } },
      ],
    };
  }

  // Real-estate leads are stored either with source "Real estate leads"
  // (survey form) or source "Meta Lead" + leadTags ["real-estate-lead"]
  // (real-estate Meta forms). Match both so the filter returns all of them.
  if (isRealEstateLeadSourceFilter(source)) {
    return {
      $or: [
        { source: { $in: REAL_ESTATE_LEAD_SOURCES } },
        { leadTags: { $in: REAL_ESTATE_LEAD_TAG_KEYS } },
      ],
    };
  }

  return { source };
}

function addMatchCondition(query, condition) {
  if (!condition || Object.keys(condition).length === 0) return query;
  if (Object.keys(query).length === 0) return condition;
  return { $and: [query, condition] };
}
const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE ||
  "https://whatsapp.limbu.ai/api/external/contact";
const WHATSAPP_EXTERNAL_API_KEY =
  process.env.WHATSAPP_EXTERNAL_API_KEY ||
  process.env.LIMBUBOT_ADMIN_API_KEY ||
  process.env.LIMBUBOT_ADMIN_TOKEN ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

function normalizePhoneE164(value) {
  let digits = String(value || "")
    .replace(/^wa_/i, "")
    .replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function mapWhatsAppMessageToHistory(message = {}) {
  return {
    role:
      String(message.direction || "").toLowerCase() === "inbound"
        ? "user"
        : "assistant",
    content: String(message.content || ""),
    time: message.sent_at || message.created_at || "",
  };
}

function getLimbuBotHistoryUserId(user = {}) {
  const explicit =
    user.chatbotUserId ||
    user.whatsappUserId ||
    user.limbuBotUserId ||
    user.botUserId ||
    "";
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().startsWith("wa_")
      ? explicit.trim()
      : `wa_${explicit.trim().replace(/\D/g, "")}`;
  }

  let phone = user.phone || user.mobileNumber || "";
  phone = String(phone).replace(/\D/g, "");
  if (!phone) return "";
  if (phone.length === 10) phone = `91${phone}`;
  return `wa_${phone}`;
}

function hasGmbConnected(user = {}) {
  return Boolean(
    user.isBusinessConnected ||
    user.connectedBusinessEmail ||
    user.gmbProjectId ||
    user.selectedBusiness?.name ||
    (Array.isArray(user.businessListings) && user.businessListings.length > 0),
  );
}

function getConversationStageFromHistory(history = [], user = {}) {
  const steps = [];
  const assistantMessages = history.filter(
    (item) => String(item?.role || "").toLowerCase() === "assistant",
  );
  const inboundUserMessageCount = history.filter(
    (item) =>
      String(item?.role || "").toLowerCase() === "user" &&
      String(item?.content || "").trim() !== "",
  ).length;
  const hasText = (...keywords) =>
    assistantMessages.some((item) => {
      const content = String(item?.content || "").toLowerCase();
      return keywords.some((keyword) =>
        content.includes(keyword.toLowerCase()),
      );
    });

  const hasConnectedStage =
    hasGmbConnected(user) ||
    hasText(
      "Congrats! Apka Account connect ho gaya!",
      "Badhaai ho! Account connect ho gaya!",
      "Account connect ho gaya",
    );
  const downstreamSteps = [];

  if (hasText("Full Health report")) downstreamSteps.push("GMB Health");
  if (hasText("Magic QR ready hai!")) downstreamSteps.push("Magic QR");
  if (hasText("Full Report (PDF)")) downstreamSteps.push("GMB Insight");
  if (hasText("Website URL")) downstreamSteps.push("Build Website");

  if (inboundUserMessageCount >= 2) steps.push("Initial Conversation");
  if (hasConnectedStage || downstreamSteps.length > 0) {
    steps.push("GMB Connected");
  }
  steps.push(...downstreamSteps);

  return { steps };
}

async function fetchLimbuBotHistory(userId) {
  if (!userId || userId === "wa_") return [];
  const phone = normalizePhoneE164(userId);
  if (!phone) return [];

  try {
    const url = new URL(LIMBUBOT_HISTORY_BASE);
    url.searchParams.set("phone", phone);

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": WHATSAPP_EXTERNAL_API_KEY,
      },
      cache: "no-store",
    });

    if (!upstream.ok) return [];

    const data = await upstream.json().catch(() => ({}));
    if (Array.isArray(data?.history)) return data.history;
    if (Array.isArray(data?.messages)) {
      return data.messages.map(mapWhatsAppMessageToHistory);
    }
    return [];
  } catch (error) {
    console.error("Conversation stage history fetch failed:", error);
    return [];
  }
}

/** Last-10-digit phone for a User doc (for matching against bot rows). */
function phoneFromUserDoc(user = {}) {
  let phone = String(user.phone || user.mobileNumber || "").replace(/\D/g, "");
  if (phone.length > 10) phone = phone.slice(-10);
  return phone;
}

async function getConversationStageUserIds(baseQuery, conversationStage) {
  const normalizedStage = String(conversationStage || "")
    .trim()
    .toLowerCase();
  if (!normalizedStage || normalizedStage === "all") return null;

  const candidates = await User.find(baseQuery)
    .select(
      "userId phone mobileNumber chatbotUserId whatsappUserId limbuBotUserId botUserId isBusinessConnected connectedBusinessEmail gmbProjectId selectedBusiness businessListings",
    )
    .lean();

  // Pull ALL WhatsApp conversations in ONE cached, paginated bulk call.
  // The /contacts endpoint already returns each contact's messages inline,
  // so we never need a per-user history request here. That per-user fan-out
  // was the cause of the request storm + upstream 500s.
  const historyByWaId = new Map();
  const historyByPhone = new Map();
  try {
    const { users: botUsers } = await fetchLimbuBotAdminUsers();
    for (const bot of botUsers || []) {
      const history = Array.isArray(bot.history) ? bot.history : [];
      if (bot.user_id) historyByWaId.set(String(bot.user_id), history);
      if (bot.phone) historyByPhone.set(String(bot.phone), history);
    }
  } catch (err) {
    // Degrade gracefully: without history we can still match DB-derived
    // stages (e.g. "GMB connected") instead of failing the whole request.
    console.error(
      "[conversationStage] bulk contacts fetch failed:",
      err.message,
    );
  }

  const matchedIds = [];

  for (const user of candidates) {
    const historyUserId = getLimbuBotHistoryUserId(user);
    const history =
      (historyUserId && historyUserId !== "wa_"
        ? historyByWaId.get(historyUserId)
        : null) ||
      historyByPhone.get(phoneFromUserDoc(user)) ||
      [];

    const steps = getConversationStageFromHistory(history, user).steps || [];
    const hasHistory = Array.isArray(history) && history.length > 0;
    const connected = hasGmbConnected(user);
    const hasStage = steps.some(
      (step) => String(step || "").toLowerCase() === normalizedStage,
    );

    let matched;
    if (normalizedStage === "gmb connected") {
      matched = connected || hasStage;
    } else if (normalizedStage === "initial conversation") {
      matched = hasHistory && hasStage;
    } else if (normalizedStage === "no activity") {
      matched = !hasHistory && !connected;
    } else {
      matched = hasStage;
    }

    if (matched) matchedIds.push(user.userId);
  }

  return matchedIds;
}

async function addConversationStageFilter(query, conversationStage) {
  const matchedIds = await getConversationStageUserIds(
    query,
    conversationStage,
  );
  if (!matchedIds) return query;

  const stageQuery = { userId: { $in: matchedIds } };
  if (Object.keys(query).length > 0) {
    return { $and: [query, stageQuery] };
  }

  return stageQuery;
}

function getRemarkCountMatch(remarkCount) {
  if (!remarkCount || remarkCount === "All") return null;

  if (remarkCount === "None") {
    return { "remarksHistory.0": { $exists: false } };
  }

  if (remarkCount === "1") {
    return {
      "remarksHistory.0": { $exists: true },
      "remarksHistory.1": { $exists: false },
    };
  }

  if (remarkCount === "2") {
    return {
      "remarksHistory.1": { $exists: true },
      "remarksHistory.2": { $exists: false },
    };
  }

  if (remarkCount === "3") {
    return {
      "remarksHistory.2": { $exists: true },
      "remarksHistory.3": { $exists: false },
    };
  }

  if (remarkCount === "More") {
    return { "remarksHistory.3": { $exists: true } };
  }

  return null;
}

/* ================= DB CONNECT ================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(
      mongooseConnectionUri(MONGODB_URI),
    );
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

/* ================= SETTING MODEL (ROUND ROBIN) ================= */

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: -1 },
});

const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

async function bumpAgentRoundRobin(rrKey) {
  return Setting.findOneAndUpdate(
    { key: rrKey },
    [
      {
        $set: {
          key: rrKey,
          value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
        },
      },
    ],
    { new: true, upsert: true },
  );
}

/* ============================================================
   POST → CREATE USER + ROUND ROBIN ASSIGNMENT
   ============================================================ */

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing body" },
        { status: 400 },
      );
    }

    // Generate userId if not provided
    if (!body.userId) {
      body.userId = `USR${Date.now()}`;
    }

    // Auto-calculate package dates based on planDuration if not provided
    if (body.planDuration && !body.packageStartDate) {
      const startDate = new Date();
      const endDate = new Date(startDate);

      const duration = body.planDuration.toLowerCase();
      if (duration === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (duration === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (duration === "half-yearly") {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (duration === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      body.packageStartDate = startDate;
      body.packageExpiryDate = endDate;
    }

    // 1️⃣ Fetch ONLY active agents
    const agents = await Admin.find({ role: "agent", isActive: true })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    let assignedAgentId = null;
    let rrValue = 0;
    let assignedAgent = null;

    if (agents && agents.length > 0) {
      // 2️⃣ Round Robin Counter
      const RR_KEY = "agentLeadRR";

      const rrDoc = await bumpAgentRoundRobin(RR_KEY);

      rrValue = parseInt(rrDoc?.value, 10);
      if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

      // 3️⃣ Round robin index
      const index = rrValue % agents.length;
      assignedAgent = agents[index];
      console.log(
        "[RR] activeAgents:",
        agents
          .map((a) => `${a._id}:${a.fullName || a.name || a.email}`)
          .join(" | "),
      );
      console.log("[RR] rrValue:", rrValue, "index:", index);
      if (assignedAgent) {
        assignedAgentId = assignedAgent._id;
      }
    }

    // 4️⃣ Create Lead
    const createPayload = { ...body, assignedAgentId: assignedAgentId };
    const src = createPayload.source;
    createPayload.leadTags = mergeMetaLeadsTag(src, createPayload.leadTags);
    const user = await User.create(createPayload);

    void runWelcomeBonusForUserId(user.userId).catch((err) =>
      console.error("runWelcomeBonusForUserId", err),
    );

    return NextResponse.json({
      success: true,
      message: assignedAgentId
        ? "Agent assigned via round robin successfully"
        : "User created (Unassigned)",
      assignedAgent: assignedAgent
        ? {
            id: assignedAgent._id,
            name: assignedAgent.fullName || assignedAgent.name,
          }
        : null,
      rrIndex: rrValue,
      totalAgents: agents ? agents.length : 0,
      user,
    });
  } catch (error) {
    console.error("ROUND ROBIN FAILED:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

/* ------------------ PATCH: ASSIGN AGENT ------------------ */
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, assignedAgentId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { assignedAgentId: assignedAgentId || null } },
      { new: true },
    ).populate("assignedAgentId", "fullName email role mobileNumber");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent assigned successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/* ============================================================
   GET → ROLE BASED USERS (ADMIN vs AGENT)
   ============================================================ */

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    /* ── Single user by userId ── */
    if (userId) {
      const user = await User.findOne({ userId }).populate(
        "assignedAgentId",
        "fullName email role mobileNumber",
      );
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, user });
    }

    const email = searchParams.get("email");
    const search = searchParams.get("search");
    const assignedAgentId = searchParams.get("assignedAgentId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 70;
    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const leadStatus = searchParams.get("leadStatus");
    const leadStage = searchParams.get("leadStage");
    const source = searchParams.get("source");
    const conversationStage = (
      searchParams.get("conversationStage") || ""
    ).trim();
    const remarkCount = searchParams.get("remarkCount");
    const chatbotChatDay = searchParams.get("chatbotChatDay");
    const franchiseLeads = searchParams.get("franchiseLeads");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Admin email required" },
        { status: 400 },
      );
    }

    /* ── Find logged-in admin ── */
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 },
      );
    }

    /* ── Batch fetch by userId list ── */
    const byUserIdsParam = searchParams.get("byUserIds");
    if (byUserIdsParam && byUserIdsParam.trim()) {
      const idList = byUserIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (idList.length === 0) {
        return NextResponse.json({
          success: true,
          users: [],
          totalUsers: 0,
          currentPage: 1,
          totalPages: 1,
          limit: 0,
        });
      }

      let idQuery = { userId: { $in: idList } };
      if (admin.role === "agent") {
        idQuery = addMatchCondition(idQuery, { assignedAgentId: admin._id });
      } else if (admin.role === "manager") {
        idQuery = addMatchCondition(idQuery, { accountManager: admin._id });
      }

      idQuery = await addConversationStageFilter(idQuery, conversationStage);

      const fetched = await User.find(idQuery)
        .populate("assignedAgentId", "fullName email role mobileNumber")
        .populate("accountManager", "fullName email role mobileNumber")
        .sort({ createdAt: -1 });

      const order = new Map(idList.map((id, i) => [String(id), i]));
      const usersOrdered = [...fetched].sort(
        (a, b) =>
          (order.get(String(a.userId)) ?? 9999) -
          (order.get(String(b.userId)) ?? 9999),
      );

      return NextResponse.json({
        success: true,
        users: usersOrdered,
        totalUsers: usersOrdered.length,
        currentPage: 1,
        totalPages: 1,
        limit: usersOrdered.length,
      });
    }

    /* ── Agent Stats ── */
    if (searchParams.get("getAgentStats") === "true") {
      let matchStage = {};

      if (admin.role === "agent") {
        matchStage.assignedAgentId = admin._id;
      } else if (admin.role === "manager") {
        matchStage.accountManager = admin._id;
      } else if (assignedAgentId) {
        if (assignedAgentId === "Unassigned") {
          matchStage.assignedAgentId = null;
        } else {
          matchStage.assignedAgentId = new mongoose.Types.ObjectId(
            assignedAgentId,
          );
        }
      }

      if (
        dateFilter &&
        startDateParam &&
        endDateParam &&
        dateFilter !== "all"
      ) {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
      }

      if (leadStatus && leadStatus !== "All") {
        if (leadStatus === "Untagged") {
          matchStage.leadStatus = { $in: ["", null, undefined] };
        } else {
          matchStage.leadStatus = leadStatus;
        }
      }

      if (leadStage && leadStage !== "All") {
        if (leadStage === "Active") {
          matchStage.leadStage = { $in: ["Active", "", null] };
        } else {
          matchStage.leadStage = leadStage;
        }
      }

      const sourceMatch = getSourceMatch(source);
      if (sourceMatch) {
        matchStage = addMatchCondition(matchStage, sourceMatch);
      }

      const remarkCountMatch = getRemarkCountMatch(remarkCount);
      if (remarkCountMatch) {
        matchStage = addMatchCondition(matchStage, remarkCountMatch);
      }

      const statsMatchStage = await addConversationStageFilter(
        matchStage,
        conversationStage,
      );

      const stats = await User.aggregate([
        { $match: statsMatchStage },
        {
          $group: {
            _id: {
              agent: "$assignedAgentId",
              stage: { $ifNull: ["$leadStage", "Active"] },
              leadStatus: { $ifNull: ["$leadStatus", "Cold"] },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const agentStats = { Unassigned: 0 };
      const stageStats = { Active: 0, "Follow Up": 0, Inactive: 0, Onboard: 0 };
      const leadStatusStats = { Hot: 0, Warm: 0, Cold: 0 };
      const detailedStats = [];

      const agentIds = [
        ...new Set(
          stats.map((item) => item?._id?.agent?.toString()).filter(Boolean),
        ),
      ];
      const agentNameMap = {};

      if (agentIds.length > 0) {
        const agents = await Admin.find({ _id: { $in: agentIds } })
          .select("_id fullName name")
          .lean();
        agents.forEach((agent) => {
          agentNameMap[agent._id.toString()] =
            agent.fullName || agent.name || "Unknown";
        });
      }

      stats.forEach((item) => {
        const agentId = item._id.agent
          ? item._id.agent.toString()
          : "Unassigned";
        const agentName =
          agentId === "Unassigned"
            ? "Unassigned"
            : agentNameMap[agentId] || "Unknown";
        const stage = item._id.stage;
        const ls = item._id.leadStatus || "Cold";
        const count = item.count;

        agentStats[agentId] = (agentStats[agentId] || 0) + count;
        stageStats[stage] = (stageStats[stage] || 0) + count;
        leadStatusStats[ls] = (leadStatusStats[ls] || 0) + count;
        detailedStats.push({
          stage,
          agentId,
          agentName,
          leadStatus: ls,
          count,
        });
      });

      let extraStats = {};

      if (admin.role === "superAdmin") {
        const { start: startOfDay, end: endOfDay } = getAppDayBounds();
        const todayCreated = {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        };

        const [
          totalUsers,
          totalSignupUsers,
          totalMetaLeadUsers,
          todayLeads,
          todayAgentAssignments,
        ] = await Promise.all([
          User.countDocuments({}),
          User.countDocuments({ source: "signup" }),
          User.countDocuments({
            $or: [
              { source: { $in: META_LEAD_SOURCES } },
              { leadTags: { $in: META_LEAD_TAG_KEYS } },
            ],
          }),
          User.countDocuments(todayCreated),
          User.aggregate([
            { $match: { ...todayCreated, assignedAgentId: { $ne: null } } },
            { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "admins",
                localField: "_id",
                foreignField: "_id",
                as: "agent",
              },
            },
            { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                agentName: { $ifNull: ["$agent.fullName", "Unknown"] },
                count: 1,
              },
            },
          ]),
        ]);

        extraStats = {
          totalUsers,
          totalSignupUsers,
          totalMetaLeadUsers,
          totalSignups: totalSignupUsers,
          totalMetaLeads: totalMetaLeadUsers,
          metaLeadsCount: totalMetaLeadUsers,
          signupLeadsCount: totalSignupUsers,
          todayLeads,
          todayAgentAssignments,
        };
      } else if (admin.role === "agent") {
        const { start: startOfDay, end: endOfDay } = getAppDayBounds();
        const todayLeads = await User.countDocuments({
          assignedAgentId: admin._id,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });
        extraStats = { todayLeads };
      }

      return NextResponse.json({
        success: true,
        stats: agentStats,
        stageStats,
        leadStatusStats,
        detailedStats,
        ...extraStats,
      });
    }

    /* ── Today's Users Count ── */
    if (searchParams.get("getTodayUsersCount") === "true") {
      const {
        start: startOfDay,
        end: endOfDay,
        calendarDate,
        timeZone,
        displayLabel,
      } = getAppDayBounds();

      let startDate = startOfDay;
      let endDate = endOfDay;

      if (
        dateFilter &&
        startDateParam &&
        endDateParam &&
        dateFilter !== "all"
      ) {
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
      }

      const todayMatch = { createdAt: { $gte: startDate, $lte: endDate } };

      const [
        todayUsersCount,
        todayBySource,
        todayMetaLeads,
        todaySignups,
        todayChatbotLeads,
      ] = await Promise.all([
        User.countDocuments(todayMatch),

        User.aggregate([
          { $match: todayMatch },
          { $group: { _id: "$source", count: { $sum: 1 } } },
        ]),

        User.countDocuments({
          ...todayMatch,
          $or: [
            { source: { $in: META_LEAD_SOURCES } },
            { leadTags: { $in: META_LEAD_TAG_KEYS } },
          ],
        }),

        User.countDocuments({
          ...todayMatch,
          source: "signup",
        }),

        User.countDocuments({
          ...todayMatch,
          source: "chatbot",
        }),
      ]);

      const sourceBreakdown = {};
      todayBySource.forEach((item) => {
        sourceBreakdown[item._id || "unknown"] = item.count;
      });

      return NextResponse.json({
        success: true,
        todayUsersCount,
        todayMetaLeads,
        todaySignups,
        todayChatbotLeads,
        sourceBreakdown,
        todayWindow: { calendarDate, timeZone, displayLabel },
      });
    }

    /* ══════════════════════════════════════════
       MAIN USER LIST — build query step by step
       ══════════════════════════════════════════ */
    let query = {};

    /* 1. Role-based base filter */
    if (admin.role === "agent") {
      query = addMatchCondition(query, { assignedAgentId: admin._id });
    } else if (admin.role === "manager") {
      query = addMatchCondition(query, { accountManager: admin._id });
    } else if (assignedAgentId) {
      if (assignedAgentId === "Unassigned") {
        query = addMatchCondition(query, { assignedAgentId: null });
      } else {
        query = addMatchCondition(query, { assignedAgentId });
      }
    }

    /* 2. Date filter */
    if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      query = addMatchCondition(query, {
        createdAt: { $gte: startDate, $lte: endDate },
      });
    }

    /* 3. Lead Status */
    if (leadStatus && leadStatus !== "All") {
      if (leadStatus === "Untagged") {
        query = addMatchCondition(query, {
          leadStatus: { $in: ["", null, undefined] },
        });
      } else {
        query = addMatchCondition(query, { leadStatus });
      }
    }

    /* 4. Lead Stage */
    /* 4. Lead Stage */
    if (leadStage && leadStage !== "All") {
      if (leadStage === "Active") {
        query = addMatchCondition(query, {
          leadStage: { $in: ["Active", "", null] },
        });
      } else if (leadStage === "Expired") {
        const today = new Date();

        query = addMatchCondition(query, {
          $or: [
            // Package expired
            {
              packageExpiryDate: {
                $exists: true,
                $lt: today,
              },
            },

            // Service expired
            {
              planExpiry: {
                $exists: true,
                $lt: today,
              },
            },
          ],
        });
      } else {
        query = addMatchCondition(query, { leadStage });
      }
    }

    /* 5. Source */
    const sourceMatch = getSourceMatch(source);
    if (sourceMatch) {
      query = addMatchCondition(query, sourceMatch);
    }

    /* 6. Remark Count */
    const remarkCountMatch = getRemarkCountMatch(remarkCount);
    if (remarkCountMatch) {
      query = addMatchCondition(query, remarkCountMatch);
    }

    /* 7. Franchise filter */
    if (franchiseLeads === "true") {
      query = addMatchCondition(query, { franchiseId: { $ne: null } });
    } else {
      // Exclude franchise leads by default
      query = addMatchCondition(query, {
        $or: [
          { franchiseId: "" },
          { franchiseId: null },
          { franchiseId: { $exists: false } },
        ],
      });
    }

    /* 8. Search */
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query = addMatchCondition(query, {
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { userId: searchRegex },
        ],
      });
    }

    /* 9. Chatbot chat day filter (short-circuits normal pagination) */
    const isChatbotDayFilter =
      chatbotChatDay === "today" || chatbotChatDay === "yesterday";

    if (isChatbotDayFilter) {
      try {
        const chatbotList = await listUsersForChatbotChatDay({
          day: chatbotChatDay,
          mongoQuery: query,
          search: search || "",
          page,
          limit,
        });
        return NextResponse.json({
          success: true,
          users: chatbotList.users,
          totalUsers: chatbotList.totalUsers,
          currentPage: chatbotList.currentPage,
          totalPages: chatbotList.totalPages,
          limit: chatbotList.limit,
          chatbotChatDay,
          chatbotDayLabel: chatbotList.chatbotDayLabel,
          chatbotDayCount: chatbotList.chatbotDayCount,
        });
      } catch (chatbotErr) {
        console.error("chatbotChatDay filter:", chatbotErr);
        return NextResponse.json(
          {
            success: false,
            error: chatbotErr.message || "Failed to load chatbot chat users",
          },
          { status: 502 },
        );
      }
    }

    /* 10. Conversation stage filter (async — must come after all sync filters) */
    query = await addConversationStageFilter(query, conversationStage);

    /* ── 10.5 totalActiveUsers — runs on final query, applies to ALL roles ── */
    // Active = leadStage is "Active", "" (empty), or null (new leads default to Active)
    const activeQuery = addMatchCondition(query, {
      leadStage: { $in: ["Active", "", null] },
    });
    const totalActiveUsers = await User.countDocuments(activeQuery);

    /* 11. Count + paginate — AFTER all filters are applied */
    const totalUsers = await User.countDocuments(query);
    const skip = (page - 1) * limit;

    /* 12. Fetch users */
    const users = await User.find(query)
      .populate("assignedAgentId", "fullName email role mobileNumber")
      .populate("accountManager", "fullName email role mobileNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    /* 13. superAdmin extra stats */
    let superAdminData = {};
    if (admin.role === "superAdmin") {
      const { start: startOfDay, end: endOfDay } = getAppDayBounds();
      const todayCreated = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

      const metaLeadCondition = {
        $or: [
          { source: { $in: META_LEAD_SOURCES } },
          { leadTags: { $in: META_LEAD_TAG_KEYS } },
        ],
      };

      const [
        totalGlobalUsers,
        totalSignupUsers,
        totalMetaLeadUsers,
        todayLeads,
        todayAgentAssignments,
      ] = await Promise.all([
        User.countDocuments(query),
        User.countDocuments(addMatchCondition(query, { source: "signup" })),
        User.countDocuments(addMatchCondition(query, metaLeadCondition)),
        User.countDocuments(todayCreated),
        User.aggregate([
          { $match: { ...todayCreated, assignedAgentId: { $ne: null } } },
          { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
          {
            $lookup: {
              from: "admins",
              localField: "_id",
              foreignField: "_id",
              as: "agent",
            },
          },
          { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              agentName: { $ifNull: ["$agent.fullName", "Unknown"] },
              count: 1,
            },
          },
        ]),
      ]);

      superAdminData = {
        totalGlobalUsers,
        totalSignupUsers,
        totalMetaLeadUsers,
        totalSignups: totalSignupUsers,
        totalMetaLeads: totalMetaLeadUsers,
        metaLeadsCount: totalMetaLeadUsers,
        signupLeadsCount: totalSignupUsers,
        todayLeads,
        todayAgentAssignments,
      };
    }

    return NextResponse.json({
      success: true,
      loggedInRole: admin.role,
      totalUsers,
      totalActiveUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
      ...superAdminData,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      userId,
      newPlan,
      paidService,
      amount,
      paidPackage,
      planDuration,
      isServiceBooked,
      planExpiry,
      leadStage,
      leadStatus,
      utrNumber,
      screenshot, // 🔥
      notes,
    } = body;

    const remark = body.remark || body.remarks;
    let followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;

    const FOLLOW_UP_REMARK_PREFIXES = ["Call Not Picked", "Call Back Later"];

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    // Check for duplicate UTR number if provided
    if (utrNumber) {
      const existingUser = await User.findOne({
        utrNumber,
        userId: { $ne: userId }, // Exclude current user
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              "UTR Number already exists. Please enter a unique UTR number.",
          },
          { status: 400 },
        );
      }
    }

    let updateData = {};

    /* -------- REMARK UPDATE -------- */
    if (remark) {
      updateData.$set = { Remarks: remark };

      const agentId = body.agentId || null;
      const agentName = body.agentName || "Admin";
      const agentObjId =
        agentId && mongoose.Types.ObjectId.isValid(agentId)
          ? new mongoose.Types.ObjectId(agentId)
          : null;

      let resolvedFollowUp = followUpDate;
      const needsFuCarry =
        remark &&
        (!resolvedFollowUp || Number.isNaN(resolvedFollowUp.getTime())) &&
        FOLLOW_UP_REMARK_PREFIXES.some((p) =>
          String(remark).trim().startsWith(p),
        );
      if (needsFuCarry) {
        const u = await User.findOne({ userId })
          .select("remarksHistory")
          .lean();
        const prev = [...(u?.remarksHistory || [])]
          .reverse()
          .find((r) => r.followUpDate);
        if (prev?.followUpDate) {
          resolvedFollowUp = new Date(prev.followUpDate);
        } else {
          resolvedFollowUp = new Date(Date.now() + 60 * 60 * 1000);
        }
      }

      const pushOperations = {
        remarksHistory: {
          text: remark,
          createdAt: new Date(),
          agentId: agentObjId,
          agentName,
          ...(resolvedFollowUp &&
            !Number.isNaN(resolvedFollowUp.getTime()) && {
              followUpDate: resolvedFollowUp,
            }),
        },
      };

      // Every remark is treated as a call interaction
      if (agentObjId || agentName) {
        updateData.$inc = { callCount: 1 };
        pushOperations.callHistory = {
          agentId: agentObjId,
          agentName,
          calledAt: new Date(),
          remark,
        };
      }

      updateData.$push = pushOperations;
    }

    /* -------- PLAN UPDATE -------- */
    if (newPlan) {
      updateData.$set = {
        ...updateData.$set,
        "subscription.plan": newPlan,
        "subscription.status": "active",
        "subscription.date": new Date(),
      };
    }

    /* -------- PACKAGE START AND EXPIRY DATE UPDATE -------- */
    if (body.packageStartDate || body.packageExpiryDate) {
      updateData.$set = {
        ...updateData.$set,
        ...(body.packageStartDate && {
          packageStartDate: new Date(body.packageStartDate),
        }),
        ...(body.packageExpiryDate && {
          packageExpiryDate: new Date(body.packageExpiryDate),
        }),
      };
    }

    /* -------- UTR NUMBER UPDATE -------- */
    if (utrNumber) {
      updateData.$set = {
        ...updateData.$set,
        utrNumber,
      };
    }

    /* -------- PAYMENT SCREENSHOT UPDATE -------- */
    if (body.paymentScreenshot) {
      updateData.$set = {
        ...updateData.$set,
        paymentScreenshot: body.paymentScreenshot,
      };
    }

    /* -------- SERVICE UPDATE -------- */
    /* -------- SERVICE UPDATE -------- */
    if (isServiceBooked === true) {
      updateData.$set = {
        ...updateData.$set,

        // 🔥 service fields
        ...(paidService && { paidService }),
        ...(paidPackage && { paidPackage }),
        ...(planDuration && { planDuration }),

        // 🔥 ADD THESE (IMPORTANT)
        ...(amount && { amount }),
        ...(screenshot && { screenshot }),
        ...(notes && { notes }),

        // 🔥 mark service booked
        isServiceBooked: true,
      };
    }

    /* -------- LEAD STAGE UPDATE -------- */
    if (leadStage) {
      updateData.$set = {
        ...updateData.$set,
        leadStage,
      };
    }

    /* -------- LEAD STATUS UPDATE (HOT/WARM/COLD) -------- */
    if (leadStatus !== undefined) {
      updateData.$set = {
        ...updateData.$set,
        leadStatus,
      };
    }

    /* -------- ACQUISITION SOURCE (admin) -------- */
    if (
      body.source !== undefined &&
      body.source !== null &&
      body.source !== ""
    ) {
      const src = String(body.source).trim();
      if (ALLOWED_USER_SOURCE_VALUES.includes(src)) {
        updateData.$set = {
          ...updateData.$set,
          source: src,
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update" },
        { status: 400 },
      );
    }

    const updatedUser = await User.findOneAndUpdate({ userId }, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT error:", error);

    // Handle duplicate key error for UTR
    if (error.code === 11000 && error.keyPattern?.utrNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "UTR Number already exists. Please enter a unique UTR number.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/* ------------------ DELETE USER (single or bulk) ------------------ */
export async function DELETE(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const ids =
      Array.isArray(body?.userIds) && body.userIds.length
        ? body.userIds.map((id) => String(id).trim()).filter(Boolean)
        : body?.userId
          ? [String(body.userId).trim()]
          : [];

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: "Missing userId or userIds" },
        { status: 400 },
      );
    }

    if (ids.length === 1) {
      const deletedUser = await User.findOneAndDelete({ userId: ids[0] });
      if (!deletedUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        message: `User with ID ${ids[0]} deleted successfully`,
        deletedCount: 1,
        userIds: ids,
      });
    }

    const deleteResult = await User.deleteMany({ userId: { $in: ids } });
    if (!deleteResult.deletedCount) {
      return NextResponse.json(
        { success: false, error: "No users found to delete" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${deleteResult.deletedCount} user(s) deleted successfully`,
      deletedCount: deleteResult.deletedCount,
      userIds: ids,
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
