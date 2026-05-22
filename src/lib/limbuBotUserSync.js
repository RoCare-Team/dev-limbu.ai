import mongoose from "mongoose";
import User from "@/models/User";
import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";
import { getAppDayBounds } from "@/lib/appDayBounds";

const LIMBUBOT_ADMIN_USERS_URL =
  process.env.LIMBUBOT_ADMIN_USERS_URL ||
  "https://limbubot.limbutech.in/api/admin/users";

const CHATBOT_EMAIL_PREFIX = "chatbot";
const CHATBOT_EMAIL_DOMAIN = "@gmail.com";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: -1 },
});
const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

/** `wa_918339876984` → 10-digit Indian mobile */
export function waIdToPhone(waUserId) {
  if (!waUserId || typeof waUserId !== "string") return "";
  let digits = waUserId.replace(/^wa_/i, "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits.length === 10 ? digits : "";
}

export function phoneToWaId(phone) {
  const p = waIdToPhone(`wa_91${String(phone).replace(/\D/g, "")}`);
  return p ? `wa_91${p}` : "";
}

async function bumpAgentRoundRobin() {
  const doc = await Setting.findOneAndUpdate(
    { key: "agentLeadRR" },
    [
      {
        $set: {
          key: "agentLeadRR",
          value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
        },
      },
    ],
    { new: true, upsert: true },
  );
  return doc;
}

async function assignNextAgentId() {
  const activeAgents = await Admin.find({ role: "agent", isActive: true })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  if (!activeAgents.length) return null;

  const rrDoc = await bumpAgentRoundRobin();
  let rrValue = parseInt(rrDoc?.value, 10);
  if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;
  return activeAgents[rrValue % activeAgents.length]._id;
}

/** Highest `chatbotNN@gmail.com` in DB; returns next index (starts at 1). */
export async function getNextChatbotEmailIndex() {
  const rows = await User.find({
    email: { $regex: /^chatbot\d+@gmail\.com$/i },
  })
    .select("email")
    .lean();

  let max = 0;
  for (const row of rows) {
    const m = String(row.email || "").match(/^chatbot(\d+)@gmail\.com$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

function formatChatbotEmail(index) {
  const n = String(index).padStart(2, "0");
  return `${CHATBOT_EMAIL_PREFIX}${n}${CHATBOT_EMAIL_DOMAIN}`;
}

/** `2026-05-21 13:37:35` → calendar date in app TZ (YYYY-MM-DD) */
export function getLastActiveCalendarDate(lastActive) {
  if (!lastActive) return "";
  const raw = String(lastActive).trim();
  const prefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefix) return prefix[1];

  const normalized = raw.replace(" ", "T");
  const withTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)
    ? normalized
    : `${normalized}+05:30`;
  const d = new Date(withTz);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function filterBotUsersByCalendarDay(botUsers, calendarDate) {
  if (!calendarDate) return [];
  return (botUsers || [])
    .filter((u) => getLastActiveCalendarDate(u.last_active) === calendarDate)
    .sort((a, b) => String(b.last_active || "").localeCompare(String(a.last_active || "")));
}

export function mapBotUserRow(bot = {}) {
  const waId = String(bot.user_id || "").trim();
  const phone = waIdToPhone(waId);
  return {
    user_id: waId,
    phone,
    message_count: Number(bot.message_count) || 0,
    last_active: bot.last_active || "",
    last_message: bot.last_message
      ? String(bot.last_message).slice(0, 280)
      : "",
  };
}

/**
 * Users who chatted on today / yesterday (IST app day).
 */
export async function getChatbotChatsByDay() {
  const todayBounds = getAppDayBounds();
  const yesterdayBounds = getAppDayBounds(
    new Date(todayBounds.start.getTime() - 36 * 3600000),
  );

  const { users: botUsers } = await fetchLimbuBotAdminUsers();

  const todayRows = filterBotUsersByCalendarDay(
    botUsers,
    todayBounds.calendarDate,
  ).map(mapBotUserRow);
  const yesterdayRows = filterBotUsersByCalendarDay(
    botUsers,
    yesterdayBounds.calendarDate,
  ).map(mapBotUserRow);

  return {
    timeZone: todayBounds.timeZone,
    today: {
      count: todayRows.length,
      calendarDate: todayBounds.calendarDate,
      label: todayBounds.displayLabel,
      users: todayRows,
    },
    yesterday: {
      count: yesterdayRows.length,
      calendarDate: yesterdayBounds.calendarDate,
      label: yesterdayBounds.displayLabel,
      users: yesterdayRows,
    },
  };
}

function virtualUserFromBotRow(row) {
  const phone = row.phone || waIdToPhone(row.user_id);
  const lastFour = phone ? phone.slice(-4) : "?";
  let createdAt = new Date();
  if (row.last_active) {
    const d = new Date(String(row.last_active).replace(" ", "T") + "+05:30");
    if (!Number.isNaN(d.getTime())) createdAt = d;
  }
  return {
    userId: `CHATBOT-${row.user_id}`,
    fullName: `WhatsApp User ${lastFour}`,
    phone,
    email: "",
    chatbotUserId: row.user_id,
    chatbotLastActive: row.last_active || "",
    chatbotMessageCount: row.message_count || 0,
    source: "chatbot",
    leadStage: "Active",
    leadStatus: "",
    wallet: 0,
    freeUsedCount: 0,
    remarksHistory: [],
    assignedAgentId: null,
    subscription: { status: "inactive", plan: "Free" },
    createdAt,
    isChatbotOnly: true,
  };
}

/**
 * Users who chatted on a given day — registered rows + chatbot-only placeholders.
 * Sorted by LimbuBot last_active (most recent first).
 */
export async function listUsersForChatbotChatDay({
  day,
  mongoQuery = {},
  search = "",
  page = 1,
  limit = 70,
}) {
  const dayStats = await getChatbotChatsByDay();
  const bucket =
    day === "yesterday" ? dayStats.yesterday : dayStats.today;
  const botRows = bucket.users || [];

  const phones = [...new Set(botRows.map((r) => r.phone).filter(Boolean))];
  const waIds = [...new Set(botRows.map((r) => r.user_id).filter(Boolean))];

  const chatbotOr = [
    ...(phones.length ? [{ phone: { $in: phones } }] : []),
    ...(waIds.length
      ? [
          { chatbotUserId: { $in: waIds } },
          { whatsappUserId: { $in: waIds } },
          { limbuBotUserId: { $in: waIds } },
        ]
      : []),
    { chatbotLastActive: { $regex: `^${bucket.calendarDate}` } },
  ];

  let userQuery =
    Object.keys(mongoQuery).length > 0
      ? { $and: [mongoQuery, { $or: chatbotOr }] }
      : { $or: chatbotOr };

  if (search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    userQuery = {
      $and: [
        userQuery,
        {
          $or: [
            { fullName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { userId: searchRegex },
            { chatbotUserId: searchRegex },
          ],
        },
      ],
    };
  }

  const registered = await User.find(userQuery)
    .populate("assignedAgentId", "fullName email role mobileNumber")
    .populate("accountManager", "fullName email role mobileNumber")
    .lean();

  const orderMap = new Map(botRows.map((r, i) => [r.user_id, i]));
  const matched = new Set();
  for (const u of registered) {
    if (u.phone) matched.add(`p:${u.phone}`);
    if (u.chatbotUserId) matched.add(`w:${u.chatbotUserId}`);
    if (u.whatsappUserId) matched.add(`w:${u.whatsappUserId}`);
    if (u.limbuBotUserId) matched.add(`w:${u.limbuBotUserId}`);
  }

  const q = search.trim().toLowerCase();
  const virtual = botRows
    .filter((r) => {
      if (matched.has(`p:${r.phone}`) || matched.has(`w:${r.user_id}`)) {
        return false;
      }
      if (!q) return true;
      const hay = `${r.phone} ${r.user_id} WhatsApp User`.toLowerCase();
      return hay.includes(q);
    })
    .map(virtualUserFromBotRow);

  const waForUser = (u) =>
    u.chatbotUserId ||
    u.whatsappUserId ||
    u.limbuBotUserId ||
    (u.phone ? `wa_91${u.phone}` : "");

  const merged = [...registered, ...virtual].sort((a, b) => {
    const ia = orderMap.get(waForUser(a)) ?? 9999;
    const ib = orderMap.get(waForUser(b)) ?? 9999;
    return ia - ib;
  });

  const totalUsers = merged.length;
  const skip = (page - 1) * limit;
  const users = merged.slice(skip, skip + limit);

  return {
    users,
    totalUsers,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    limit,
    chatbotDayLabel: bucket.label,
    chatbotDayCount: bucket.count,
  };
}

export async function fetchLimbuBotAdminUsers() {
  const headers = { Accept: "application/json" };
  const apiKey =
    process.env.LIMBUBOT_ADMIN_API_KEY || process.env.LIMBUBOT_ADMIN_TOKEN;
  if (apiKey) {
    headers.Authorization = apiKey.startsWith("Bearer ")
      ? apiKey
      : `Bearer ${apiKey}`;
  }

  const res = await fetch(LIMBUBOT_ADMIN_USERS_URL, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `LimbuBot users API ${res.status}: ${text.slice(0, 200) || res.statusText}`,
    );
  }

  const data = await res.json();
  const users = Array.isArray(data?.users) ? data.users : [];
  return { total: data?.total ?? users.length, users };
}

/**
 * Register chatbot WhatsApp users who are not yet in the app DB.
 * Placeholder email: chatbot01@gmail.com, chatbot02@gmail.com, …
 */
export async function syncChatbotUsersToApp(options = {}) {
  const { minMessageCount = 1, maxToInsert = 50 } = options;

  await dbConnect();

  const { users: botUsers } = await fetchLimbuBotAdminUsers();
  let emailCounter = await getNextChatbotEmailIndex();

  let inserted = 0;
  let skipped = 0;
  let linked = 0;
  const errors = [];

  for (const bot of botUsers) {
    if (inserted >= maxToInsert) break;

    const waId = String(bot.user_id || "").trim();
    const phone = waIdToPhone(waId);
    const messageCount = Number(bot.message_count) || 0;

    if (!phone) {
      skipped++;
      continue;
    }
    if (messageCount < minMessageCount) {
      skipped++;
      continue;
    }

    const existingByPhone = await User.findOne({ phone });
    const existingByWa = waId
      ? await User.findOne({
          $or: [
            { chatbotUserId: waId },
            { whatsappUserId: waId },
            { limbuBotUserId: waId },
          ],
        })
      : null;

    const existing = existingByPhone || existingByWa;

    if (existing) {
      const patch = {};
      if (waId && !existing.chatbotUserId) patch.chatbotUserId = waId;
      if (bot.last_active) patch.chatbotLastActive = bot.last_active;
      if (messageCount) patch.chatbotMessageCount = messageCount;
      if (Object.keys(patch).length) {
        await User.updateOne({ _id: existing._id }, { $set: patch });
        linked++;
      } else {
        skipped++;
      }
      continue;
    }

    let email = formatChatbotEmail(emailCounter);
    while (await User.findOne({ email }).select("_id").lean()) {
      emailCounter++;
      email = formatChatbotEmail(emailCounter);
    }
    emailCounter++;

    const assignedAgentId = await assignNextAgentId();
    const lastFour = phone.slice(-4);
    const fullName = `WhatsApp User ${lastFour}`;

    try {
      const created = await User.create({
        userId: `USR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        fullName,
        email,
        phone,
        chatbotUserId: waId,
        chatbotLastActive: bot.last_active || null,
        chatbotMessageCount: messageCount,
        chatbotLastMessage: bot.last_message
          ? String(bot.last_message).slice(0, 500)
          : null,
        wallet: 500,
        freeUsedCount: 2,
        igPrice: 0,
        fbPrice: 0,
        gmbPrice: 20,
        imgGeneratePrice: 80,
        assignedAgentId,
        source: "chatbot",
        subscription: {
          status: "inactive",
          plan: "Free",
          startDate: null,
          endDate: null,
        },
      });

      inserted++;

      void runWelcomeBonusForUserId(created.userId).catch((err) =>
        console.error("[chatbot-sync] welcomeBonus", err),
      );
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        errors.push({ waId, phone, message: err.message });
      }
    }
  }

  return {
    fetched: botUsers.length,
    inserted,
    skipped,
    linked,
    errors,
  };
}
