import mongoose from "mongoose";
import User from "@/models/User";
import Admin from "@/models/Admin";
import ChatbotStageSnapshot from "@/models/ChatbotStageSnapshot";
import dbConnect from "@/lib/dbConnect";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";
import { getAppDayBounds } from "@/lib/appDayBounds";
import {
  fetchAllDemoBookings,
  getDemoBookingMetricUsers,
  normalizeBookingPhone,
} from "@/lib/demoBookings";

const LIMBUBOT_ADMIN_USERS_URL =
  process.env.LIMBUBOT_ADMIN_USERS_URL ||
  "https://whatsapp.limbu.ai/api/external/contacts";
const LIMBUBOT_ADMIN_USERS_AFTER =
  process.env.LIMBUBOT_ADMIN_USERS_AFTER || "2026-05-07";

const CHATBOT_EMAIL_PREFIX = "chatbot";
const CHATBOT_EMAIL_DOMAIN = "@gmail.com";

const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE ||
  "https://whatsapp.limbu.ai/api/external/contact";

const WHATSAPP_EXTERNAL_API_KEY =
  process.env.WHATSAPP_EXTERNAL_API_KEY ||
  process.env.LIMBUBOT_ADMIN_API_KEY ||
  process.env.LIMBUBOT_ADMIN_TOKEN ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

const HISTORY_TIMEOUT_MS = 8_000;
const STAGE_BATCH_SIZE = 25;
const FETCH_TIMEOUT_MS = 10_000;
const PAGE_FETCH_CONCURRENCY = 8;
const SNAPSHOT_KEY = "default";
const SNAPSHOT_TTL_MS = 10 * 60 * 1000;

// Simple in-process TTL cache
let _limbuBotCache = null;
let _limbuBotCacheAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

let _stageSnapshotBuildPromise = null;
const DEMO_BOOKED_STAGE = "Demo Booked";

async function loadChatbotDemoBookingsByPhone() {
  const map = new Map();
  try {
    const bookings = await fetchAllDemoBookings();
    for (const booking of bookings) {
      const phone = normalizeBookingPhone(booking.phone);
      if (!phone) continue;
      const existing = map.get(phone);
      if (
        !existing ||
        new Date(booking.createdAt).getTime() <
          new Date(existing.createdAt).getTime()
      ) {
        map.set(phone, booking);
      }
    }
  } catch (err) {
    console.error("[limbuBotUserSync] demo bookings load failed:", err.message);
  }
  return map;
}

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

function normalizePhoneE164(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function waIdToE164(waUserId) {
  return normalizePhoneE164(String(waUserId || "").replace(/^wa_/i, ""));
}

function whatsappHeaders() {
  return {
    Accept: "application/json",
    "X-API-Key": WHATSAPP_EXTERNAL_API_KEY,
  };
}

function mapWhatsAppMessageToHistory(message = {}) {
  return {
    id: message.id,
    role:
      String(message.direction || "").toLowerCase() === "inbound"
        ? "user"
        : "assistant",
    type: message.type || "text",
    content: String(message.content || ""),
    status: message.status || "",
    time: message.sent_at || message.created_at || "",
    created_at: message.created_at || "",
  };
}

function mapWhatsAppContactRow(contact = {}) {
  const e164 = normalizePhoneE164(contact.phone);
  const phone = waIdToPhone(`wa_${e164}`);
  const messages = Array.isArray(contact.messages) ? contact.messages : [];

  // FIX: filter out system messages (wamid null or empty type) before finding lastMessage
  const realMessages = messages.filter(
    (m) => m.wamid !== null && m.type !== "",
  );

  const systemDropped = messages.length - realMessages.length;
  if (systemDropped > 0) {
    console.log(
      `[mapWhatsAppContactRow] 🗑️ System msgs dropped: ${systemDropped} | phone: ${contact.phone} | total: ${messages.length} | real: ${realMessages.length}`,
    );
  }

  const lastMessage = realMessages
    .slice()
    .sort((a, b) =>
      String(b?.sent_at || b?.created_at || "").localeCompare(
        String(a?.sent_at || a?.created_at || ""),
      ),
    )[0];

  return {
    user_id: e164 ? `wa_${e164}` : "",
    phone,
    name: contact.name || "",
    email: contact.email || "",
    message_count:
      Number(
        contact.total_messages ||
          contact.message_count ||
          contact.messages_count ||
          messages.length,
      ) || 0,
    last_active:
      contact.last_active ||
      contact.last_message_at ||
      contact.updated_at ||
      lastMessage?.sent_at ||
      lastMessage?.created_at ||
      contact.created_at ||
      "",
    last_message:
      contact.last_message || lastMessage?.content
        ? String(contact.last_message || lastMessage?.content).slice(0, 280)
        : "",
    history: messages.map(mapWhatsAppMessageToHistory),
    contact,
  };
}

export function getNonIndianCountryCode(waUserId) {
  if (!waUserId || typeof waUserId !== "string") return null;
  const digits = waUserId.replace(/^wa_/i, "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return null;
  if (digits.length >= 10) return digits.slice(0, digits.length - 10);
  return "unknown";
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
  if (!activeAgents.length) {
    console.warn(
      "[RoundRobin] ⚠️ Koi active agent nahi mila DB mein (role:agent, isActive:true)",
    );
    return null;
  }

  const rrDoc = await bumpAgentRoundRobin();
  let rrValue = parseInt(rrDoc?.value, 10);
  if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

  const index = rrValue % activeAgents.length;
  const agent = activeAgents[index];

  // console.log(
  //   `[RoundRobin] ✅ Agent assign: ${agent.fullName || agent.email} | index=${index} | total agents=${activeAgents.length}`,
  // );

  return agent._id;
}

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

function buildChatbotUserPayload(bot, { email, assignedAgentId } = {}) {
  const waId = String(bot.user_id || "").trim();
  const phone = bot.phone || waIdToPhone(waId);

  return {
    userId: `USR${Date.now()}${Math.floor(Math.random() * 1000)}`,
    fullName:
      bot.name ||
      bot.contact?.name ||
      `WhatsApp User ${phone ? phone.slice(-4) : ""}`,
    email,
    phone,
    chatbotUserId: waId,
    whatsappUserId: waId,
    limbuBotUserId: waId,
    wallet: 500,
    freeUsedCount: 2,
    igPrice: 0,
    fbPrice: 0,
    gmbPrice: 20,
    imgGeneratePrice: 80,
    assignedAgentId,
    source: "chatbot",
    leadStage: "Active",
    subscription: {
      status: "inactive",
      plan: "Free",
      startDate: null,
      endDate: null,
    },
    chatbotLastActive: bot.last_active || bot.contact?.updated_at || null,
    chatbotMessageCount: Number(bot.message_count) || 0,
    chatbotLastMessage: bot.last_message
      ? String(bot.last_message).slice(0, 500)
      : null,
  };
}

async function getNextAvailableChatbotEmailState() {
  const takenEmailRows = await User.find({
    email: { $regex: /^chatbot\d+@gmail\.com$/i },
  })
    .select("email")
    .lean();

  const takenEmails = new Set(
    takenEmailRows.map((row) => String(row.email || "").toLowerCase()),
  );

  let emailCounter = 1;
  for (const email of takenEmails) {
    const match = email.match(/^chatbot(\d+)@gmail\.com$/i);
    if (match)
      emailCounter = Math.max(emailCounter, parseInt(match[1], 10) + 1);
  }

  return { takenEmails, emailCounter };
}

function takeNextChatbotEmail(state) {
  let email = formatChatbotEmail(state.emailCounter);
  while (state.takenEmails.has(email.toLowerCase())) {
    state.emailCounter++;
    email = formatChatbotEmail(state.emailCounter);
  }
  state.takenEmails.add(email.toLowerCase());
  state.emailCounter++;
  return email;
}

export async function ensureChatbotRowsSaved(botRows = []) {
  await dbConnect();

  const normalizedRows = (botRows || [])
    .map((row) => ({
      ...row,
      user_id: String(row?.user_id || "").trim(),
      phone: row?.phone || waIdToPhone(String(row?.user_id || "").trim()),
    }))
    .filter((row) => row.user_id && row.phone);

  if (!normalizedRows.length) {
    return { inserted: 0, linked: 0, assigned: 0, skipped: 0, errors: [] };
  }

  const phones = [...new Set(normalizedRows.map((row) => row.phone))];
  const waIds = [...new Set(normalizedRows.map((row) => row.user_id))];
  const existingUsers = await User.find({
    $or: [
      { phone: { $in: phones } },
      { chatbotUserId: { $in: waIds } },
      { whatsappUserId: { $in: waIds } },
      { limbuBotUserId: { $in: waIds } },
    ],
  })
    .select(
      "_id phone chatbotUserId whatsappUserId limbuBotUserId assignedAgentId",
    )
    .lean();

  const existingByPhone = new Map();
  const existingByWaId = new Map();
  for (const user of existingUsers) {
    if (user.phone) existingByPhone.set(String(user.phone), user);
    for (const key of ["chatbotUserId", "whatsappUserId", "limbuBotUserId"]) {
      if (user[key]) existingByWaId.set(String(user[key]), user);
    }
  }

  const emailState = await getNextAvailableChatbotEmailState();
  let inserted = 0;
  let linked = 0;
  let assigned = 0;
  let skipped = 0;
  const errors = [];

  for (const bot of normalizedRows) {
    // ✅ AFTER
    const messageCount = Number(bot.message_count) || 0;
    if (messageCount < 1) {
      console.log(
        `[ensureChatbotRowsSaved] ⏭️ SKIP (no messages) | phone: ${bot.phone} | waId: ${bot.user_id}`,
      );
      skipped++;
      continue;
    }

    const history = Array.isArray(bot.history) ? bot.history : [];
    const inboundCount = history.filter(
      (m) =>
        String(m?.role || "").toLowerCase() === "user" &&
        String(m?.content || "").trim() !== "",
    ).length;

    if (inboundCount < 2) {
      console.log(
        `[ensureChatbotRowsSaved] ⏭️ SKIP (inbound < 2) | phone: ${bot.phone} | waId: ${bot.user_id} | inboundCount: ${inboundCount} | totalMessages: ${messageCount}`,
      );
      skipped++;
      continue;
    }

    const existing =
      existingByWaId.get(bot.user_id) || existingByPhone.get(bot.phone);

    try {
      if (existing) {
        const stages =
          Array.isArray(bot.stages) && bot.stages.length
            ? bot.stages
            : [...detectConversationStages(history)];
        const setData = {
          chatbotUserId: bot.user_id,
          whatsappUserId: bot.user_id,
          limbuBotUserId: bot.user_id,
          chatbotLastActive: bot.last_active || bot.contact?.updated_at || null,
          chatbotMessageCount: messageCount,
          chatbotLastMessage: bot.last_message
            ? String(bot.last_message).slice(0, 500)
            : null,
          conversationStages: stages.length ? stages : [],
          chatbotStagesSyncedAt: new Date(),
        };

        if (!existing.assignedAgentId) {
          const assignedAgentId = await assignNextAgentId();
          if (assignedAgentId) {
            setData.assignedAgentId = assignedAgentId;
            assigned++;
          }
        }

        await User.updateOne({ _id: existing._id }, { $set: setData });
        console.log(
          `[ensureChatbotRowsSaved] 🔗 LINKED (updated) | phone: ${bot.phone} | waId: ${bot.user_id} | inbound: ${inboundCount} | stages: ${JSON.stringify(setData.conversationStages)}`,
        );

        linked++;
        continue;
      }

      const assignedAgentId = await assignNextAgentId();
      const email = takeNextChatbotEmail(emailState);
      const created = await User.create(
        buildChatbotUserPayload(bot, { email, assignedAgentId }),
      );

      existingByPhone.set(String(created.phone), created);
      if (bot.user_id) existingByWaId.set(bot.user_id, created);
      console.log(
        `[ensureChatbotRowsSaved] ✅ INSERTED new user | phone: ${bot.phone} | waId: ${bot.user_id} | name: ${bot.name || "?"} | inbound: ${inboundCount}`,
      );
      inserted++;

      void runWelcomeBonusForUserId(created.userId).catch((err) =>
        console.error("[chatbot-ensure] welcomeBonus error:", err),
      );
    } catch (err) {
      if (err.code === 11000) {
        linked++;
      } else {
        errors.push({
          waId: bot.user_id,
          phone: bot.phone,
          message: err.message,
        });
      }
    }
  }

  console.log(
    `[ensureChatbotRowsSaved] ═══ DONE | inserted: ${inserted} | linked: ${linked} | assigned: ${assigned} | skipped: ${skipped} | errors: ${errors.length}`,
  );

  if (inserted || linked || assigned) invalidateLimbuBotCache();

  return { inserted, linked, assigned, skipped, errors };
}

export function getLastActiveCalendarDate(lastActive) {
  if (!lastActive) return "";
  const raw = String(lastActive).trim();
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
    .sort((a, b) =>
      String(b.last_active || "").localeCompare(String(a.last_active || "")),
    );
}

function getInboundMessagesForCalendarDay(bot = {}, calendarDate) {
  if (!calendarDate) return [];
  const history = Array.isArray(bot.history) ? bot.history : [];

  return history.filter((message) => {
    if (String(message?.role || "").toLowerCase() !== "user") return false;
    const messageDate = getLastActiveCalendarDate(
      message.time || message.created_at,
    );
    return messageDate === calendarDate;
  });
}

export function filterBotUsersByInboundCalendarDay(botUsers, calendarDate) {
  if (!calendarDate) return [];

  return (botUsers || [])
    .map((bot) => {
      const inboundMessages = getInboundMessagesForCalendarDay(
        bot,
        calendarDate,
      );
      if (!inboundMessages.length) return null;

      const latestInbound = inboundMessages
        .slice()
        .sort((a, b) =>
          String(b.time || b.created_at || "").localeCompare(
            String(a.time || a.created_at || ""),
          ),
        )[0];

      return {
        ...bot,
        inbound_messages_for_day: inboundMessages,
        inbound_message_count_for_day: inboundMessages.length,
        last_inbound_at: latestInbound?.time || latestInbound?.created_at || "",
        last_inbound_message: latestInbound?.content
          ? String(latestInbound.content).slice(0, 500)
          : "",
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(b.last_inbound_at || b.last_active || "").localeCompare(
        String(a.last_inbound_at || a.last_active || ""),
      ),
    );
}

export function mapBotUserRow(bot = {}) {
  const waId = String(bot.user_id || "").trim();
  const phone = bot.phone || waIdToPhone(waId);
  return {
    user_id: waId,
    phone,
    name: bot.name || bot.contact?.name || "",
    email: bot.email || bot.contact?.email || "",
    message_count: Number(bot.message_count) || 0,
    last_active: bot.last_active || "",
    last_message: bot.last_message
      ? String(bot.last_message).slice(0, 280)
      : "",
    last_inbound_at: bot.last_inbound_at || "",
    last_inbound_message: bot.last_inbound_message || "",
    inbound_message_count_for_day:
      Number(bot.inbound_message_count_for_day) || 0,
    inbound_messages_for_day: Array.isArray(bot.inbound_messages_for_day)
      ? bot.inbound_messages_for_day
      : [],
    history: Array.isArray(bot.history) ? bot.history : [],
    contact: bot.contact || null,
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

  // console.log(`\n[getChatbotChatsByDay] ═══════════════════════════════`);
  // console.log(
  //   `[getChatbotChatsByDay] 📦 Total WhatsApp contacts fetched: ${botUsers.length}`,
  // );
  // console.log(
  //   `[getChatbotChatsByDay] 📅 Today date (IST): ${todayBounds.calendarDate}`,
  // );
  // console.log(
  //   `[getChatbotChatsByDay] 📅 Yesterday date (IST): ${yesterdayBounds.calendarDate}`,
  // );

  const todayRows = filterBotUsersByInboundCalendarDay(
    botUsers,
    todayBounds.calendarDate,
  ).map(mapBotUserRow);

  const yesterdayRows = filterBotUsersByInboundCalendarDay(
    botUsers,
    yesterdayBounds.calendarDate,
  ).map(mapBotUserRow);

  // ── TODAY LOG ──
  // console.log(
  //   `\n[TODAY LEADS] ✅ Count: ${todayRows.length} | Date: ${todayBounds.calendarDate}`,
  // );
  if (todayRows.length > 0) {
    console.table(
      todayRows.map((u) => ({
        phone: u.phone,
        user_id: u.user_id,
        messages: u.message_count,
        inbound_today: u.inbound_message_count_for_day,
        last_inbound_at: u.last_inbound_at,
        last_active: u.last_active,
        last_inbound_message: String(u.last_inbound_message || "").slice(0, 60),
      })),
    );
    console.dir(todayRows, { depth: 5 });
  } else {
    console.log("[TODAY LEADS] ⚠️ Koi user nahi mila aaj ke liye");
  }

  // ── YESTERDAY LOG ──
  // console.log(
  //   `\n[YESTERDAY LEADS] ✅ Count: ${yesterdayRows.length} | Date: ${yesterdayBounds.calendarDate}`,
  // );
  if (yesterdayRows.length > 0) {
    console.table(
      yesterdayRows.map((u) => ({
        phone: u.phone,
        user_id: u.user_id,
        messages: u.message_count,
        inbound_yesterday: u.inbound_message_count_for_day,
        last_inbound_at: u.last_inbound_at,
        last_active: u.last_active,
        last_inbound_message: String(u.last_inbound_message || "").slice(0, 60),
      })),
    );
    console.dir(yesterdayRows, { depth: 5 });
  } else {
    console.log("[YESTERDAY LEADS] ⚠️ Koi user nahi mila kal ke liye");
  }

  // console.log(`[getChatbotChatsByDay] ═══════════════════════════════\n`);

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
  const contact = row.contact || {};
  const history = Array.isArray(row.history) ? row.history : [];
  const conversationStages = [...detectConversationStages(history)];
  let createdAt = new Date();
  if (row.last_active) {
    const d = new Date(String(row.last_active).replace(" ", "T") + "+05:30");
    if (!Number.isNaN(d.getTime())) createdAt = d;
  }
  return {
    userId: `CHATBOT-${row.user_id}`,
    fullName: contact.name || row.name || `WhatsApp User ${lastFour}`,
    phone,
    email: contact.email || row.email || "",
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
    whatsappContactId: contact.id || null,
    whatsappChatStatus: contact.chat_status || "",
    chatbotHistory: history,
    conversationStages: conversationStages.length ? conversationStages : [],
  };
}

async function mapBotStageRowsToTableUsers(botRows = [], options = {}) {
  await dbConnect();
  if (!options.skipPersist) {
    await ensureChatbotRowsSaved(botRows);
  }

  const phones = [...new Set(botRows.map((r) => r.phone).filter(Boolean))];
  const waIds = [...new Set(botRows.map((r) => r.user_id).filter(Boolean))];

  const registered =
    phones.length || waIds.length
      ? await User.find({
          $or: [
            ...(phones.length ? [{ phone: { $in: phones } }] : []),
            ...(waIds.length
              ? [
                  { chatbotUserId: { $in: waIds } },
                  { whatsappUserId: { $in: waIds } },
                  { limbuBotUserId: { $in: waIds } },
                ]
              : []),
          ],
        })
          .populate("assignedAgentId", "fullName email role mobileNumber")
          .populate("accountManager", "fullName email role mobileNumber")
          .lean()
      : [];

  // console.log(
  //   `[mapBotStageRowsToTableUsers] 📋 botRows: ${botRows.length} | DB mein registered: ${registered.length}`,
  // );

  const registeredByPhone = new Map();
  const registeredByWaId = new Map();

  for (const user of registered) {
    if (user.phone) registeredByPhone.set(String(user.phone), user);
    for (const key of ["chatbotUserId", "whatsappUserId", "limbuBotUserId"]) {
      if (user[key]) registeredByWaId.set(String(user[key]), user);
    }
  }

  return botRows.map((row) => {
    const registeredUser =
      (row.user_id && registeredByWaId.get(String(row.user_id))) ||
      (row.phone && registeredByPhone.get(String(row.phone)));

    const user = registeredUser || virtualUserFromBotRow(row);

    return {
      ...user,
      chatbotUserId: user.chatbotUserId || row.user_id,
      chatbotLastActive: row.last_active || user.chatbotLastActive || "",
      chatbotMessageCount: row.message_count || user.chatbotMessageCount || 0,
      chatbotLastMessage: row.last_message || user.chatbotLastMessage || "",
      conversationStages: row.stages || [],
      chatbotHistory: row.history || user.chatbotHistory || [],
      whatsappContactId: row.contact?.id || user.whatsappContactId || null,
      whatsappChatStatus:
        row.contact?.chat_status || user.whatsappChatStatus || "",
      isChatbotOnly: user.isChatbotOnly || !registeredUser,
    };
  });
}

function dedupeBotStageRows(rows = []) {
  const byWaId = new Map();

  for (const row of rows) {
    const waId = String(row?.user_id || "").trim();
    if (!waId) continue;

    const existing = byWaId.get(waId);
    if (!existing) {
      byWaId.set(waId, {
        ...row,
        stages: Array.isArray(row.stages) ? [...row.stages] : [],
      });
      continue;
    }

    const stages = new Set([
      ...(Array.isArray(existing.stages) ? existing.stages : []),
      ...(Array.isArray(row.stages) ? row.stages : []),
    ]);

    byWaId.set(waId, {
      ...existing,
      ...row,
      stages: [...stages],
      message_count: Math.max(
        Number(existing.message_count) || 0,
        Number(row.message_count) || 0,
      ),
      last_active:
        String(row.last_active || "").localeCompare(
          String(existing.last_active || ""),
        ) > 0
          ? row.last_active
          : existing.last_active,
      last_message: row.last_message || existing.last_message || "",
    });
  }

  return [...byWaId.values()].sort((a, b) =>
    String(b.last_active || "").localeCompare(String(a.last_active || "")),
  );
}

export async function listUsersForChatbotChatDay({
  day,
  mongoQuery = {},
  search = "",
  page = 1,
  limit = 70,
}) {
  const dayStats = await getChatbotChatsByDay();
  const bucket = day === "yesterday" ? dayStats.yesterday : dayStats.today;
  const botRows = bucket.users || [];
  await ensureChatbotRowsSaved(botRows);

  // console.log(
  //   `\n[listUsersForChatbotChatDay] 📅 Day: ${day} | Bucket date: ${bucket.calendarDate} | botRows: ${botRows.length}`,
  // );

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

  // console.log(
  //   `[listUsersForChatbotChatDay] 🗃️ DB se registered users mile: ${registered.length}`,
  // );

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

  // console.log(
  //   `[listUsersForChatbotChatDay] 👻 Virtual (chatbot-only) users: ${virtual.length}`,
  // );

  const botByPhone = new Map(botRows.map((r) => [String(r.phone || ""), r]));
  const botByWaId = new Map(botRows.map((r) => [String(r.user_id || ""), r]));

  const waForUser = (u) =>
    u.chatbotUserId ||
    u.whatsappUserId ||
    u.limbuBotUserId ||
    (u.phone ? `wa_91${u.phone}` : "");

  const registeredWithBotData = registered.map((user) => {
    const waId = waForUser(user);
    const bot =
      botByWaId.get(String(waId || "")) ||
      botByPhone.get(String(user.phone || ""));
    if (!bot) return user;

    const history = Array.isArray(bot.history) ? bot.history : [];
    const stages = [...detectConversationStages(history)];

    return {
      ...user,
      chatbotUserId: user.chatbotUserId || bot.user_id,
      chatbotLastActive: bot.last_active || user.chatbotLastActive || "",
      chatbotMessageCount: bot.message_count || user.chatbotMessageCount || 0,
      chatbotLastMessage: bot.last_message || user.chatbotLastMessage || "",
      chatbotHistory: history,
      conversationStages: stages.length ? stages : [],
      whatsappContactId: bot.contact?.id || user.whatsappContactId || null,
      whatsappChatStatus:
        bot.contact?.chat_status || user.whatsappChatStatus || "",
    };
  });

  const merged = [...registeredWithBotData, ...virtual].sort((a, b) => {
    const ia = orderMap.get(waForUser(a)) ?? 9999;
    const ib = orderMap.get(waForUser(b)) ?? 9999;
    return ia - ib;
  });

  // console.log(
  //   `[listUsersForChatbotChatDay] ✅ Total merged users (page ${page}): ${merged.length}`,
  // );

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

export async function fetchLimbuBotAdminUsers({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && _limbuBotCache && now - _limbuBotCacheAt < CACHE_TTL_MS) {
    // console.log(
    //   `[fetchLimbuBotAdminUsers] ⚡ Cache se return (${_limbuBotCache.users.length} users)`,
    // );
    return _limbuBotCache;
  }

  // console.log(
  //   `[fetchLimbuBotAdminUsers] 🌐 WhatsApp API se fresh data fetch ho raha hai...`,
  // );

  const fetchPage = async (page, limit = 50) => {
    const url = new URL(LIMBUBOT_ADMIN_USERS_URL);
    url.searchParams.set("after", LIMBUBOT_ADMIN_USERS_AFTER);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const pageRes = await fetch(url, {
      headers: whatsappHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!pageRes.ok) {
      const text = await pageRes.text().catch(() => "");
      throw new Error(
        `WhatsApp contacts API ${pageRes.status}: ${text.slice(0, 200) || pageRes.statusText}`,
      );
    }

    return pageRes.json();
  };

  const firstData = await fetchPage(1);
  const contacts = Array.isArray(firstData?.contacts)
    ? [...firstData.contacts]
    : Array.isArray(firstData?.users)
      ? [...firstData.users]
      : [];
  const pagination = firstData?.pagination || {};
  const pageLimit = Number(pagination.limit) || 50;
  const totalPages = Math.max(1, Number(pagination.total_pages) || 1);

  // console.log(
  //   `[fetchLimbuBotAdminUsers] 📄 Total pages: ${totalPages} | Page limit: ${pageLimit} | Total contacts: ${pagination.total || "?"}`,
  // );

  for (let start = 2; start <= totalPages; start += PAGE_FETCH_CONCURRENCY) {
    const pageNumbers = [];
    for (
      let page = start;
      page < start + PAGE_FETCH_CONCURRENCY && page <= totalPages;
      page += 1
    ) {
      pageNumbers.push(page);
    }
    const pageResults = await Promise.all(
      pageNumbers.map((page) => fetchPage(page, pageLimit)),
    );
    for (const pageData of pageResults) {
      const pageContacts = Array.isArray(pageData?.contacts)
        ? pageData.contacts
        : Array.isArray(pageData?.users)
          ? pageData.users
          : [];
      contacts.push(...pageContacts);
    }
  }

  const users = contacts
    .map(mapWhatsAppContactRow)
    .filter((row) => row.user_id);
  console.log(
    `[fetchLimbuBotAdminUsers] ✅ Fetched | total contacts: ${contacts.length} | valid Indian users: ${users.length} | dropped (non-Indian/empty): ${allMapped.length - users.length}`,
  );

  // console.log(
  //   `[fetchLimbuBotAdminUsers] ✅ Total mapped users (Indian numbers): ${users.length} / ${contacts.length}`,
  // );

  const result = {
    total: Number(pagination.total) || users.length,
    users,
    pagination,
  };

  _limbuBotCache = result;
  _limbuBotCacheAt = now;

  return result;
}

export function invalidateLimbuBotCache() {
  _limbuBotCache = null;
  _limbuBotCacheAt = 0;
  _stageSnapshotBuildPromise = null;
}

function toCompactStageRow(row = {}) {
  const contact = row.contact || null;
  return {
    user_id: row.user_id,
    phone: row.phone,
    name: row.name || contact?.name || "",
    email: row.email || contact?.email || "",
    message_count: Number(row.message_count) || 0,
    last_active: row.last_active || "",
    last_message: row.last_message
      ? String(row.last_message).slice(0, 200)
      : "",
    stages: Array.isArray(row.stages) ? row.stages : [],
    contact: contact
      ? {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          chat_status: contact.chat_status,
        }
      : null,
  };
}

function indexStageUsers(allUsers = []) {
  const stageUsers = Object.fromEntries(
    CONVERSATION_STAGE_KEYS.map((s) => [s, []]),
  );
  for (const user of allUsers) {
    for (const stage of user.stages || []) {
      if (stageUsers[stage]) stageUsers[stage].push(user);
    }
  }
  return stageUsers;
}

function hydrateSnapshotDoc(doc) {
  if (!doc) return null;
  const allUsers = Array.isArray(doc.users) ? doc.users : [];
  return {
    total: Number(doc.total) || allUsers.length,
    stageCounts: doc.stageCounts || {},
    stageUsers: indexStageUsers(allUsers),
    allUsers,
    stageOrder: doc.stageOrder?.length
      ? doc.stageOrder
      : CONVERSATION_STAGE_KEYS,
    fetchedAt: doc.fetchedAt || doc.updatedAt,
    fromCache: true,
  };
}

async function readConversationStagesSnapshot() {
  await dbConnect();
  const doc = await ChatbotStageSnapshot.findOne({ key: SNAPSHOT_KEY }).lean();
  if (!doc?.fetchedAt) return null;
  const age = Date.now() - new Date(doc.fetchedAt).getTime();
  if (age > SNAPSHOT_TTL_MS) return null;
  return hydrateSnapshotDoc(doc);
}

async function writeConversationStagesSnapshot(payload) {
  await dbConnect();
  const compactUsers = (payload.allUsers || []).map(toCompactStageRow);
  await ChatbotStageSnapshot.findOneAndUpdate(
    { key: SNAPSHOT_KEY },
    {
      key: SNAPSHOT_KEY,
      total: payload.total,
      stageCounts: payload.stageCounts,
      stageOrder: payload.stageOrder,
      users: compactUsers,
      fetchedAt: new Date(payload.fetchedAt || Date.now()),
    },
    { upsert: true, new: true },
  );
  return hydrateSnapshotDoc({
    ...payload,
    users: compactUsers,
    fetchedAt: payload.fetchedAt,
  });
}

export async function buildConversationStagesFromApi({
  bypassCache = false,
} = {}) {
  const [{ total, users: botUsers }, demoByPhone] = await Promise.all([
    fetchLimbuBotAdminUsers({ bypassCache }),
    loadChatbotDemoBookingsByPhone(),
  ]);

  const allUsers = [];

  for (let i = 0; i < botUsers.length; i += STAGE_BATCH_SIZE) {
    const chunk = botUsers.slice(i, i + STAGE_BATCH_SIZE);

    await Promise.all(
      chunk.map(async (bot) => {
        const waId = String(bot.user_id || "").trim();
        const history = Array.isArray(bot.history) ? bot.history : [];
        const matched = detectConversationStages(history);
        const stages = [...matched];
        const phone = waIdToPhone(waId);
        if (
          phone &&
          demoByPhone.has(phone) &&
          !stages.includes(DEMO_BOOKED_STAGE)
        ) {
          stages.push(DEMO_BOOKED_STAGE);
        }

        allUsers.push(
          toCompactStageRow({
            user_id: waId,
            phone: waIdToPhone(waId),
            name: bot.name || bot.contact?.name || "",
            email: bot.email || bot.contact?.email || "",
            message_count: Number(bot.message_count) || 0,
            last_active: bot.last_active || "",
            last_message: bot.last_message
              ? String(bot.last_message).slice(0, 200)
              : "",
            contact: bot.contact || null,
            stages,
          }),
        );
      }),
    );
  }

  const dedupedAllUsers = dedupeBotStageRows(allUsers);
  const stageCounts = Object.fromEntries(
    CONVERSATION_STAGE_KEYS.map((s) => [s, 0]),
  );
  for (const user of dedupedAllUsers) {
    for (const stage of user.stages || []) {
      if (stageCounts[stage] !== undefined) stageCounts[stage]++;
    }
  }

  const chatStartedCount = dedupedAllUsers.filter(
    (user) => (user.stages || []).length > 0,
  ).length;

  return {
    total: chatStartedCount,
    stageCounts,
    stageUsers: indexStageUsers(dedupedAllUsers),
    allUsers: dedupedAllUsers,
    stageOrder: CONVERSATION_STAGE_KEYS,
    fetchedAt: new Date().toISOString(),
  };
}

export async function refreshConversationStagesSnapshot({
  bypassCache = true,
  persistUsers = false,
} = {}) {
  const built = await buildConversationStagesFromApi({ bypassCache });
  if (persistUsers) {
    const { users: freshBotUsers } = await fetchLimbuBotAdminUsers({
      bypassCache: true,
    });
    await ensureChatbotRowsSaved(freshBotUsers);
  }
  return writeConversationStagesSnapshot(built);
}

async function loadOrBuildConversationStagesSnapshot({
  refresh = false,
  persistUsers = false,
} = {}) {
  if (!refresh) {
    const cached = await readConversationStagesSnapshot();
    if (cached) return cached;
  }

  if (_stageSnapshotBuildPromise) {
    return _stageSnapshotBuildPromise;
  }

  _stageSnapshotBuildPromise = refreshConversationStagesSnapshot({
    bypassCache: refresh,
    persistUsers,
  }).finally(() => {
    _stageSnapshotBuildPromise = null;
  });

  return _stageSnapshotBuildPromise;
}

export async function syncChatbotUsersToApp(options = {}) {
  const { minMessageCount = 1, maxToInsert = 500 } = options;

  await dbConnect();

  const { users: botUsers } = await fetchLimbuBotAdminUsers({
    bypassCache: true,
  });

  const takenEmailRows = await User.find({
    email: { $regex: /^chatbot\d+@gmail\.com$/i },
  })
    .select("email")
    .lean();

  const takenEmails = new Set(takenEmailRows.map((r) => r.email.toLowerCase()));

  let emailCounter = 1;
  {
    let max = 0;
    for (const e of takenEmails) {
      const m = e.match(/^chatbot(\d+)@gmail\.com$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    emailCounter = max + 1;
  }

  let inserted = 0;
  let skipped = 0;
  let linked = 0;
  const errors = [];
  const nonIndian = [];

  for (const bot of botUsers) {
    if (inserted >= maxToInsert) {
      break;
    }

    const waId = String(bot.user_id || "").trim();
    const phone = waIdToPhone(waId);
    const messageCount = Number(bot.message_count) || 0;

    if (!phone) {
      const cc = getNonIndianCountryCode(waId);
      if (cc) {
        nonIndian.push({ waId, countryCode: cc });
      }
      skipped++;
      continue;
    }

    if (messageCount < minMessageCount) {
      skipped++;
      continue;
    }

    // ✅ YEH NAYA BLOCK ADD KARO (existing code ke baad)
    const history = Array.isArray(bot.history) ? bot.history : [];
    const inboundCount = history.filter(
      (m) =>
        String(m?.role || "").toLowerCase() === "user" &&
        String(m?.content || "").trim() !== "",
    ).length;
    // ✅ AFTER
    if (inboundCount < 2) {
      console.log(
        `[syncChatbotUsersToApp] ⏭️ SKIP (inbound < 2) | phone: ${phone} | waId: ${waId} | inboundCount: ${inboundCount}`,
      );
      skipped++;
      continue;
    }

    const filter = {
      $or: [
        { phone },
        ...(waId
          ? [
              { chatbotUserId: waId },
              { whatsappUserId: waId },
              { limbuBotUserId: waId },
            ]
          : []),
      ],
    };

    try {
      const existing = await User.findOne(filter).select("_id email").lean();

      if (existing) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              chatbotLastActive:
                bot.last_active || bot.contact?.updated_at || null,
              chatbotMessageCount: messageCount,
              chatbotLastMessage: bot.last_message
                ? String(bot.last_message).slice(0, 500)
                : null,
              ...(waId ? { chatbotUserId: waId } : {}),
            },
          },
        );
        linked++;
        continue;
      }

      let email = formatChatbotEmail(emailCounter);
      while (takenEmails.has(email.toLowerCase())) {
        emailCounter++;
        email = formatChatbotEmail(emailCounter);
      }
      takenEmails.add(email.toLowerCase());
      emailCounter++;

      const assignedAgentId = await assignNextAgentId();

      const created = await User.create({
        userId: `USR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        fullName:
          bot.name || bot.contact?.name || `WhatsApp User ${phone.slice(-4)}`,
        email,
        phone,
        chatbotUserId: waId,
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
        chatbotLastActive: bot.last_active || bot.contact?.updated_at || null,
        chatbotMessageCount: messageCount,
        chatbotLastMessage: bot.last_message
          ? String(bot.last_message).slice(0, 500)
          : null,
      });

      inserted++;

      void runWelcomeBonusForUserId(created.userId).catch((err) =>
        console.error("[chatbot-sync] welcomeBonus error:", err),
      );
    } catch (err) {
      if (err.code === 11000) {
        linked++;
      } else {
        console.error(
          `[syncChatbotUsersToApp] ❌ Error for ${phone}:`,
          err.message,
        );
        errors.push({ waId, phone, message: err.message });
      }
    }
  }

  invalidateLimbuBotCache();

  try {
    await refreshConversationStagesSnapshot({
      bypassCache: true,
      persistUsers: false,
    });
  } catch (err) {
    console.error(
      "[syncChatbotUsersToApp] stage snapshot refresh failed:",
      err,
    );
  }

  return {
    fetched: botUsers.length,
    inserted,
    skipped,
    linked,
    nonIndian,
    errors,
  };
}

export const CONVERSATION_STAGE_KEYS = [
  "Initial Conversation",
  "GMB Connected",
  "GMB Health",
  "Magic QR",
  "GMB Insight",
  "Build Website",
  "Demo Booked",
];

export const CHATBOT_SUMMARY_METRIC_DEFS = [
  { id: "chatsCreated", label: "Chats Created", stage: null },
  { id: "gmbConnected", label: "GMB Connected", stage: "GMB Connected" },
  { id: "gmbHealth", label: "GMB Health Generated", stage: "GMB Health" },
  { id: "magicQr", label: "Magic QR Created", stage: "Magic QR" },
  { id: "gmbInsights", label: "GMB Insights Generated", stage: "GMB Insight" },
  { id: "websitesBuilt", label: "Websites Built", stage: "Build Website" },
  { id: "demoBooked", label: "Demo Booked", stage: "Demo Booked" },
];

const _STAGE_KEYWORDS = {
  "GMB Connected": [
    "Congrats! Apka Account connect ho gaya!",
    "Badhaai ho! Account connect ho gaya!",
    "Account connect ho gaya",
  ],
  "GMB Health": ["Full Health report"],
  "Magic QR": ["Magic QR ready hai!"],
  "GMB Insight": ["Full Report (PDF)"],
  "Build Website": ["Website URL"],
  "Demo Booked": [
    "demo book",
    "demo booked",
    "demo session",
    "webinar",
    "seminar",
    "zoom meeting",
    "meeting id",
    "demo confirm",
  ],
};

export async function fetchLimbuBotHistory(userId) {
  if (!userId || userId === "wa_") return [];
  const phone = waIdToE164(userId);
  if (!phone) return [];

  try {
    const url = new URL(LIMBUBOT_HISTORY_BASE);
    url.searchParams.set("phone", phone);

    const res = await fetch(url, {
      headers: whatsappHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data?.history)) return data.history;
    if (Array.isArray(data?.messages)) {
      return data.messages.map(mapWhatsAppMessageToHistory);
    }
    return [];
  } catch {
    return [];
  }
}

export function detectConversationStages(history = []) {
  const matched = new Set();

  const assistantMsgs = history.filter(
    (m) => String(m?.role || "").toLowerCase() === "assistant",
  );

  const inboundUserMessageCount = history.filter(
    (m) =>
      String(m?.role || "").toLowerCase() === "user" &&
      String(m?.content || "").trim() !== "",
  ).length;

  const hasHistory = history.length > 0;

  const assistantHas = (...keywords) =>
    assistantMsgs.some((m) => {
      const c = String(m?.content || "").toLowerCase();
      return keywords.some((k) => c.includes(k.toLowerCase()));
    });

  if (!hasHistory) {
    return matched;
  }

  const hasGmbConnected = assistantHas(..._STAGE_KEYWORDS["GMB Connected"]);
  const downstreamStages = Object.entries(_STAGE_KEYWORDS)
    .filter(([stage]) => stage !== "GMB Connected")
    .filter(([, keywords]) => assistantHas(...keywords))
    .map(([stage]) => stage);

  if (inboundUserMessageCount >= 2) matched.add("Initial Conversation");
  if (hasGmbConnected || downstreamStages.length > 0) {
    matched.add("GMB Connected");
  }
  for (const stage of downstreamStages) matched.add(stage);

  return matched;
}

function getStageFirstAchievedCalendarDate(history = [], stage) {
  if (!stage || stage === "Initial Conversation") {
    const inbound = (history || []).filter(
      (m) =>
        String(m?.role || "").toLowerCase() === "user" &&
        String(m?.content || "").trim() !== "",
    );
    if (!inbound.length) return "";
    const sorted = inbound
      .slice()
      .sort((a, b) =>
        String(a.time || a.created_at || "").localeCompare(
          String(b.time || b.created_at || ""),
        ),
      );
    return getLastActiveCalendarDate(
      sorted[0]?.time || sorted[0]?.created_at || "",
    );
  }

  const keywords = _STAGE_KEYWORDS[stage];
  if (!keywords?.length) return "";

  const assistantMsgs = (history || [])
    .filter((m) => String(m?.role || "").toLowerCase() === "assistant")
    .slice()
    .sort((a, b) =>
      String(a.time || a.created_at || "").localeCompare(
        String(b.time || b.created_at || ""),
      ),
    );

  for (const message of assistantMsgs) {
    const content = String(message?.content || "").toLowerCase();
    if (keywords.some((k) => content.includes(k.toLowerCase()))) {
      return getLastActiveCalendarDate(
        message.time || message.created_at || "",
      );
    }
  }
  return "";
}

function countTodayStageAchievements(botUsers = [], stage, calendarDate) {
  if (!calendarDate) return 0;
  let count = 0;
  for (const bot of botUsers) {
    const history = Array.isArray(bot.history) ? bot.history : [];
    if (!stage) {
      if (getInboundMessagesForCalendarDay(bot, calendarDate).length) count++;
      continue;
    }
    if (getStageFirstAchievedCalendarDate(history, stage) === calendarDate) {
      count++;
    }
  }
  return count;
}

/** Total + today counts for WhatsApp chatbot dashboard summary cards. */
export async function getChatbotDashboardMetrics({
  filterByAgent = null,
  role = null,
} = {}) {
  const todayBounds = getAppDayBounds();
  const calendarDate = todayBounds.calendarDate;

  const [snapshot, { users: botUsers }] = await Promise.all([
    loadOrBuildConversationStagesSnapshot({ refresh: false }),
    fetchLimbuBotAdminUsers(),
  ]);

  // If agent filter is provided, compute metrics scoped to that agent
  if (role === "agent" && filterByAgent) {
    // Map all bot rows to table users once to build agent filter map
    const allMappedUsers = await mapBotStageRowsToTableUsers(
      snapshot.allUsers || [],
    );
    const byAgent = (u) => u.assignedAgentId?.email === filterByAgent;

    // Get IDs of users assigned to this agent
    const agentUserIds = new Set(
      allMappedUsers
        .filter(byAgent)
        .map((u) =>
          String(
            u.chatbotUserId || u.whatsappUserId || u.limbuBotUserId || "",
          ).trim(),
        )
        .filter(Boolean),
    );

    // Filter bot users by agent assignment
    const agentBotUsers = botUsers.filter((bot) =>
      agentUserIds.has(String(bot.user_id || "").trim()),
    );

    // Calculate totals from snapshot (already mapped)
    const agentMappedUsers = allMappedUsers.filter(byAgent);

    const chatStartedTotal = agentMappedUsers.filter(
      (user) => (user.conversationStages || []).length > 0,
    ).length;

    const totals = {
      chatsCreated: chatStartedTotal,
      gmbConnected: agentMappedUsers.filter((u) =>
        (u.conversationStages || []).includes("GMB Connected"),
      ).length,
      gmbHealth: agentMappedUsers.filter((u) =>
        (u.conversationStages || []).includes("GMB Health"),
      ).length,
      magicQr: agentMappedUsers.filter((u) =>
        (u.conversationStages || []).includes("Magic QR"),
      ).length,
      gmbInsights: agentMappedUsers.filter((u) =>
        (u.conversationStages || []).includes("GMB Insight"),
      ).length,
      websitesBuilt: agentMappedUsers.filter((u) =>
        (u.conversationStages || []).includes("Build Website"),
      ).length,
    };

    // For today counts, use filtered botUsers
    const today = {
      chatsCreated: countTodayStageAchievements(
        agentBotUsers,
        null,
        calendarDate,
      ),
      gmbConnected: countTodayStageAchievements(
        agentBotUsers,
        "GMB Connected",
        calendarDate,
      ),
      gmbHealth: countTodayStageAchievements(
        agentBotUsers,
        "GMB Health",
        calendarDate,
      ),
      magicQr: countTodayStageAchievements(
        agentBotUsers,
        "Magic QR",
        calendarDate,
      ),
      gmbInsights: countTodayStageAchievements(
        agentBotUsers,
        "GMB Insight",
        calendarDate,
      ),
      websitesBuilt: countTodayStageAchievements(
        agentBotUsers,
        "Build Website",
        calendarDate,
      ),
    };

    const yesterdayBounds = getAppDayBounds(
      new Date(todayBounds.start.getTime() - 36 * 3600000),
    );
    const yesterdayChats = filterBotUsersByInboundCalendarDay(
      agentBotUsers,
      yesterdayBounds.calendarDate,
    ).length;

    return {
      timeZone: todayBounds.timeZone,
      calendarDate,
      todayLabel: todayBounds.displayLabel,
      yesterdayLabel: yesterdayBounds.displayLabel,
      yesterdayChats,
      todayChats: today.chatsCreated,
      totals,
      today,
      fetchedAt: snapshot.fetchedAt || new Date().toISOString(),
      cached: Boolean(snapshot.fromCache),
    };
  }

  const stageCounts = snapshot.stageCounts || {};
  const chatStartedTotal = (snapshot.allUsers || []).filter(
    (user) => (user.stages || []).length > 0,
  ).length;

  const totals = {
    chatsCreated: chatStartedTotal,
    gmbConnected: stageCounts["GMB Connected"] || 0,
    gmbHealth: stageCounts["GMB Health"] || 0,
    magicQr: stageCounts["Magic QR"] || 0,
    gmbInsights: stageCounts["GMB Insight"] || 0,
    websitesBuilt: stageCounts["Build Website"] || 0,
  };

  const today = {
    chatsCreated: countTodayStageAchievements(botUsers, null, calendarDate),
    gmbConnected: countTodayStageAchievements(
      botUsers,
      "GMB Connected",
      calendarDate,
    ),
    gmbHealth: countTodayStageAchievements(
      botUsers,
      "GMB Health",
      calendarDate,
    ),
    magicQr: countTodayStageAchievements(botUsers, "Magic QR", calendarDate),
    gmbInsights: countTodayStageAchievements(
      botUsers,
      "GMB Insight",
      calendarDate,
    ),
    websitesBuilt: countTodayStageAchievements(
      botUsers,
      "Build Website",
      calendarDate,
    ),
  };

  const yesterdayBounds = getAppDayBounds(
    new Date(todayBounds.start.getTime() - 36 * 3600000),
  );
  const yesterdayChats = filterBotUsersByInboundCalendarDay(
    botUsers,
    yesterdayBounds.calendarDate,
  ).length;

  return {
    timeZone: todayBounds.timeZone,
    calendarDate,
    todayLabel: todayBounds.displayLabel,
    yesterdayLabel: yesterdayBounds.displayLabel,
    yesterdayChats,
    todayChats: today.chatsCreated,
    totals,
    today,
    fetchedAt: snapshot.fetchedAt || new Date().toISOString(),
    cached: Boolean(snapshot.fromCache),
  };
}

const CHATBOT_METRIC_STAGE_MAP = {
  chatsCreated: null,
  gmbConnected: "GMB Connected",
  gmbHealth: "GMB Health",
  magicQr: "Magic QR",
  gmbInsights: "GMB Insight",
  websitesBuilt: "Build Website",
  demoBooked: DEMO_BOOKED_STAGE,
};

function filterBotRowsForMetric(botUsers = [], metricId, period, calendarDate) {
  const stage = CHATBOT_METRIC_STAGE_MAP[metricId];

  if (period === "today") {
    if (metricId === "chatsCreated") {
      return filterBotUsersByInboundCalendarDay(botUsers, calendarDate).map(
        mapBotUserRow,
      );
    }
    return botUsers
      .filter((bot) => {
        const history = Array.isArray(bot.history) ? bot.history : [];
        return (
          getStageFirstAchievedCalendarDate(history, stage) === calendarDate
        );
      })
      .map(mapBotUserRow);
  }

  return [];
}

function filterSnapshotRowsForMetric(snapshot, metricId) {
  const stage = CHATBOT_METRIC_STAGE_MAP[metricId];
  if (metricId === "chatsCreated") {
    return (snapshot.allUsers || []).filter(
      (user) => (user.stages || []).length > 0,
    );
  }
  return snapshot.stageUsers?.[stage] || [];
}

/** Paginated users for a WhatsApp overview metric card (total or today). */
export async function getChatbotMetricUsers({
  metricId,
  period = "total",
  page = 1,
  limit = 70,
  filterByAgent = null,
  role = null,
} = {}) {
  if (!metricId || !(metricId in CHATBOT_METRIC_STAGE_MAP)) {
    throw new Error("Invalid chatbot metric");
  }
  if (period !== "total" && period !== "today") {
    throw new Error("Invalid period");
  }

  if (metricId === "demoBooked") {
    return getDemoBookingMetricUsers({
      period,
      page,
      limit,
      filterByAgent,
      role,
      autoSync: true,
    });
  }

  const todayBounds = getAppDayBounds();
  const calendarDate = todayBounds.calendarDate;
  let rows = [];

  if (period === "today") {
    const { users: botUsers } = await fetchLimbuBotAdminUsers();
    rows = dedupeBotStageRows(
      filterBotRowsForMetric(botUsers, metricId, period, calendarDate),
    );
  } else {
    const snapshot = await loadOrBuildConversationStagesSnapshot({
      refresh: false,
    });
    rows = dedupeBotStageRows(filterSnapshotRowsForMetric(snapshot, metricId));
  }

  let users = await mapBotStageRowsToTableUsers(rows);

  // Filter by agent if agent is viewing
  if (role === "agent" && filterByAgent) {
    users = users.filter(
      (user) => user.assignedAgentId?.email === filterByAgent,
    );
  }

  const totalUsers = users.length;
  const skip = (page - 1) * limit;
  const pageUsers = users.slice(skip, skip + limit);

  return {
    success: true,
    metricId,
    period,
    users: pageUsers,
    totalUsers,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    limit,
  };
}

export async function getLimbuBotConversationStages(options = {}) {
  return loadOrBuildConversationStagesSnapshot(options);
}

export async function getLimbuBotStageWithUsers({
  stage = "",
  page = 1,
  limit = 50,
  refresh = false,
} = {}) {
  const { total, stageCounts, stageUsers, allUsers, stageOrder, fetchedAt } =
    await loadOrBuildConversationStagesSnapshot({
      refresh,
      persistUsers: refresh,
    });

  const base = {
    success: true,
    total,
    stageCounts,
    stageOrder,
    fetchedAt,
    cached: !refresh,
  };

  if (!stage) {
    return base;
  }

  const chatStartedUsers = dedupeBotStageRows(allUsers).filter(
    (user) => (user.stages || []).length > 0,
  );
  const allForStage =
    stage === "All" ? chatStartedUsers : stageUsers[stage] || [];
  const totalUsers = allForStage.length;
  const skip = (page - 1) * limit;
  const pageRows = allForStage.slice(skip, skip + limit);

  return {
    ...base,
    stage,
    users: await mapBotStageRowsToTableUsers(pageRows, {
      skipPersist: !refresh,
    }),
    totalUsers,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    limit,
  };
}
