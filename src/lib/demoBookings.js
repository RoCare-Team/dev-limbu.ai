import mongoose from "mongoose";
import User from "@/models/User";
import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import { getAppDayBounds } from "@/lib/appDayBounds";
import { pickAgentForLead } from "@/lib/leadAgentAssign";

const DEMO_COLLECTION = "demoBookings";
const DEV_REMOTE_BOOK_DEMO_URL =
  process.env.BOOK_DEMO_REMOTE_URL?.trim() ||
  (process.env.NODE_ENV === "development"
    ? "https://limbu.ai/api/bookDemo"
    : "");

const DemoBookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    seminarTime: { type: String, required: true },
    selectedDate: { type: String, required: true },
    userCreated: { type: Boolean, default: false },
    status: { type: String, default: "Not Attended" },
  },
  { timestamps: true, collection: DEMO_COLLECTION },
);

let _allBookingsCache = null;
let _allBookingsCacheAt = 0;
const BOOKINGS_CACHE_MS = 2 * 60 * 1000;

// ✅ Reuses the main DB connection — no separate DB, no timeout issues
export async function getDemoBookingModel() {
  await dbConnect();
  const conn = mongoose.connection;
  return (
    conn.models.demoBookings ||
    conn.model("demoBookings", DemoBookingSchema)
  );
}

function mergeBookingsById(lists = []) {
  const byId = new Map();
  for (const list of lists) {
    for (const row of list || []) {
      if (row?._id) byId.set(String(row._id), row);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

async function fetchRemoteDemoBookings(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.data)) return null;
    return data.data;
  } catch (err) {
    console.warn("[demoBookings] remote read failed:", err.message);
    return null;
  }
}

const AGENT_PHONE_MAP = {
  "jahan singh": "919311587741",
  "imran ahmed": "917065021272",
};

export function normalizeBookingPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits.length === 10 ? digits : "";
}

function phoneToWaId(phone) {
  const p = normalizeBookingPhone(phone);
  return p ? `wa_91${p}` : "";
}

/** Normalize "4:00 PM IST" / "4:00 PM" to the same key */
export function normalizeSeminarTime(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/\bist\b/g, "")
    .trim();
}

export function demoSlotKey(selectedDate, seminarTime) {
  const date = normalizeBookingSelectedDate(selectedDate);
  const time = normalizeSeminarTime(seminarTime);
  return date && time ? `${date}|${time}` : "";
}

const DEMO_SLOT_TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";
const DEMO_SLOT_START_HOUR = 9;
const DEMO_SLOT_END_HOUR = 21;

function formatDemoSlotLabel(hour24) {
  const period = hour24 >= 12 ? "PM" : "AM";
  let h = hour24 % 12;
  if (h === 0) h = 12;
  return `${h}:00 ${period} IST`;
}

/** Hourly demo slots: 9:00 AM – 9:00 PM IST (Mon–Sat; Sunday closed). */
export function getDemoSlotsForWeekday(weekday) {
  if (weekday === 0) return [];
  const slots = [];
  for (let hour = DEMO_SLOT_START_HOUR; hour <= DEMO_SLOT_END_HOUR; hour++) {
    slots.push(formatDemoSlotLabel(hour));
  }
  return slots;
}

export function getDemoSlotsForDate(selectedDate) {
  const normalized = normalizeBookingSelectedDate(selectedDate);
  if (!normalized) return getDemoSlotsForWeekday(null);
  const [y, m, d] = normalized.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
  return getDemoSlotsForWeekday(weekday);
}

function getISTCalendarDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEMO_SLOT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getISTClockMinutes(date = new Date()) {
  const timeStr = date.toLocaleTimeString("en-GB", {
    timeZone: DEMO_SLOT_TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [h, mi] = timeStr.split(":").map(Number);
  return h * 60 + mi;
}

export function parseSeminarTimeToMinutes(label) {
  const s = normalizeSeminarTime(label);
  const match = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const mi = parseInt(match[2], 10);
  const ap = match[3];
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + mi;
}

/** Hide slots that already passed for today's date (IST). */
export function isDemoSlotPastForDate(selectedDate, slotLabel, now = new Date()) {
  const date = normalizeBookingSelectedDate(selectedDate);
  if (!date) return false;
  if (date !== getISTCalendarDate(now)) return false;
  const slotMin = parseSeminarTimeToMinutes(slotLabel);
  if (slotMin == null) return false;
  return slotMin <= getISTClockMinutes(now);
}

export function getBookedSlotKeysForDate(bookings = [], selectedDate) {
  const date = normalizeBookingSelectedDate(selectedDate);
  if (!date) return new Set();
  const keys = new Set();
  for (const booking of bookings) {
    if (normalizeBookingSelectedDate(booking.selectedDate) !== date) continue;
    const key = demoSlotKey(booking.selectedDate, booking.seminarTime);
    if (key) keys.add(key);
  }
  return keys;
}

export async function getDemoSlotAvailability(selectedDate) {
  const date = normalizeBookingSelectedDate(selectedDate);
  const bookings = await fetchAllDemoBookings();
  const bookedKeys = getBookedSlotKeysForDate(bookings, date);
  const now = new Date();
  const slots = getDemoSlotsForDate(date)
    .filter((label) => !isDemoSlotPastForDate(date, label, now))
    .map((label) => {
      const key = demoSlotKey(date, label);
      return {
        label,
        key,
        booked: bookedKeys.has(key),
      };
    });

  return {
    date,
    slots,
    bookedCount: slots.filter((s) => s.booked).length,
    availableCount: slots.filter((s) => !s.booked).length,
  };
}

export async function isDemoSlotBooked(selectedDate, seminarTime) {
  const key = demoSlotKey(selectedDate, seminarTime);
  if (!key) return false;
  const bookings = await fetchAllDemoBookings();
  return getBookedSlotKeysForDate(bookings, selectedDate).has(key);
}

export function invalidateDemoBookingsCache() {
  _allBookingsCache = null;
  _allBookingsCacheAt = 0;
}

export async function fetchAllDemoBookings({ bypassCache = false } = {}) {
  if (
    !bypassCache &&
    _allBookingsCache &&
    Date.now() - _allBookingsCacheAt < BOOKINGS_CACHE_MS
  ) {
    return _allBookingsCache;
  }

  const DemoBooking = await getDemoBookingModel();
  let bookings = await DemoBooking.find().sort({ createdAt: -1 }).lean();

  // In dev with few local rows, fall back to production read API
  if (bookings.length <= 1 && DEV_REMOTE_BOOK_DEMO_URL) {
    const remote = await fetchRemoteDemoBookings(DEV_REMOTE_BOOK_DEMO_URL);
    if (remote?.length > bookings.length) {
      bookings = remote;
    }
  }

  _allBookingsCache = bookings;
  _allBookingsCacheAt = Date.now();
  return bookings;
}

export function formatDemoSelectedDate(value) {
  const normalized = normalizeBookingSelectedDate(value);
  if (!normalized) return value ? String(value) : "—";
  const [y, m, d] = normalized.split("-").map(Number);
  if (!y || !m || !d) return normalized;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

export async function enrichDemoBookingsList(bookings = []) {
  await dbConnect();

  const phones = [
    ...new Set(
      bookings.map((b) => normalizeBookingPhone(b.phone)).filter(Boolean),
    ),
  ];

  const registered = phones.length
    ? await User.find({ phone: { $in: phones } })
        .populate("assignedAgentId", "fullName email")
        .select("phone assignedAgentId accountManagerName")
        .lean()
    : [];

  const registeredByPhone = new Map(
    registered.map((user) => [String(user.phone), user]),
  );

  return bookings.map((booking) => {
    const phone = normalizeBookingPhone(booking.phone);
    const user = phone ? registeredByPhone.get(phone) : null;
    const agent = user?.assignedAgentId;
    const normalizedDate =
      normalizeBookingSelectedDate(booking.selectedDate) ||
      booking.selectedDate ||
      "";

    return {
      ...booking,
      selectedDate: normalizedDate,
      selectedDateLabel: formatDemoSelectedDate(normalizedDate),
      assignedAgentName:
        agent?.fullName || user?.accountManagerName || "Unassigned",
      assignedAgentEmail: agent?.email || "",
      userRegistered: Boolean(booking.userCreated || user),
    };
  });
}

async function filterUsersByAgentEmail(users = [], agentEmail) {
  if (!agentEmail) return users;
  const admin = await Admin.findOne({ email: agentEmail })
    .select("_id email")
    .lean();
  if (!admin) return users;

  const adminId = String(admin._id);
  return users.filter((user) => {
    const assigned = user.assignedAgentId;
    if (!assigned) return false;
    if (typeof assigned === "object") {
      return (
        assigned.email === agentEmail || String(assigned._id) === adminId
      );
    }
    return String(assigned) === adminId;
  });
}

export async function getDemoBookingsAdminPayload() {
  const bookings = await fetchAllDemoBookings({ bypassCache: true });
  const { calendarDate } = getAppDayBounds();
  const enriched = await enrichDemoBookingsList(bookings);
  const todayBookings = filterBookingsBySelectedDate(enriched, calendarDate);

  return {
    success: true,
    count: enriched.length,
    todayCount: todayBookings.length,
    calendarDate,
    data: enriched,
    todayData: todayBookings,
  };
}

export function normalizeBookingSelectedDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function filterBookingsBySelectedDate(bookings = [], calendarDate) {
  if (!calendarDate) return [];
  const target = String(calendarDate).trim();
  return bookings.filter((booking) => {
    const selected = normalizeBookingSelectedDate(booking.selectedDate);
    if (selected === target) return true;
    if (String(booking.selectedDate || "").trim().startsWith(target)) {
      return true;
    }
    return false;
  });
}

async function getNextAgent() {
  // Least-loaded assignment — dekho lib/leadAgentAssign.js
  return pickAgentForLead();
}

async function sendAgentLeadAssignedTemplate({
  agentName,
  agentPhone,
  customerName,
  customerPhone,
  selectedDate,
  seminarTime,
}) {
  try {
    const whatsappNumber = String(agentPhone || "").replace(/\D/g, "");
    const finalNumber = whatsappNumber.startsWith("91")
      ? whatsappNumber
      : `91${whatsappNumber}`;

    await fetch("https://whatsapp.limbu.ai/api/campaigns/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,
        campaignName: "agent_demo_alert",
        destination: finalNumber,
        userName: "Limbu AI",
        templateParams: [
          agentName,
          customerName,
          selectedDate,
          seminarTime,
          customerPhone,
        ],
        source: "api",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {},
      }),
    });
  } catch (error) {
    console.error("[demoBookings] agent template error:", error);
  }
}

function getAgentPhoneByName(fullName) {
  if (!fullName) return null;
  return AGENT_PHONE_MAP[fullName.trim().toLowerCase()] || null;
}

export async function ensureUserFromDemoBooking(booking) {
  await dbConnect();
  const DemoBooking = await getDemoBookingModel();

  const phone = normalizeBookingPhone(booking.phone);
  if (!phone) {
    return { ok: false, reason: "invalid_phone" };
  }

  let user = await User.findOne({ phone });
  let created = false;

  if (!user) {
    const assignedAgent = await getNextAgent();
    const totalUsers = await User.countDocuments();
    user = await User.create({
      userId: `USR${Date.now()}${totalUsers + 1}`,
      fullName: booking.name || "Demo Lead",
      phone,
      email: `${phone}@demo.local`,
      source: "chatbot",
      leadStage: "Active",
      leadStatus: "",
      assignedAgentId: assignedAgent?._id || null,
      accountManager: assignedAgent?._id || null,
      accountManagerName: assignedAgent?.fullName || null,
      isServiceBooked: true,
      chatbotUserId: phoneToWaId(phone) || null,
    });
    created = true;

    const agentPhone = getAgentPhoneByName(assignedAgent?.fullName);
    if (assignedAgent && agentPhone) {
      await sendAgentLeadAssignedTemplate({
        agentName: assignedAgent.fullName,
        agentPhone,
        customerName: booking.name,
        customerPhone: phone,
        selectedDate: booking.selectedDate,
        seminarTime: booking.seminarTime,
      });
    }
  } else if (!user.isServiceBooked) {
    await User.updateOne(
      { _id: user._id },
      { $set: { isServiceBooked: true, fullName: user.fullName || booking.name } },
    );
  }

  if (!booking.userCreated) {
    await DemoBooking.updateOne(
      { _id: booking._id },
      { $set: { userCreated: true } },
    );
  }

  return { ok: true, created, userId: user.userId, user };
}

export async function syncPendingDemoBookings({ bookingIds = null } = {}) {
  const DemoBooking = await getDemoBookingModel();
  const query = { userCreated: false };
  if (Array.isArray(bookingIds) && bookingIds.length) {
    query._id = { $in: bookingIds };
  }

  const pending = await DemoBooking.find(query).lean();
  const results = { success: 0, skipped: 0, errors: 0, created: 0 };

  for (const booking of pending) {
    try {
      const phone = normalizeBookingPhone(booking.phone);
      const existing = phone ? await User.findOne({ phone }) : null;
      if (existing) {
        await DemoBooking.updateOne(
          { _id: booking._id },
          { $set: { userCreated: true } },
        );
        results.skipped++;
        continue;
      }

      const result = await ensureUserFromDemoBooking(booking);
      if (result.ok) {
        results.success++;
        if (result.created) results.created++;
      } else {
        results.errors++;
      }
    } catch (err) {
      results.errors++;
      console.error("[syncPendingDemoBookings]", booking._id, err.message);
    }
  }

  invalidateDemoBookingsCache();
  return results;
}

function virtualUserFromDemoBooking(booking) {
  const phone = normalizeBookingPhone(booking.phone);
  return {
    userId: `DEMO-${booking._id}`,
    fullName: booking.name || "Demo Lead",
    phone,
    email: phone ? `${phone}@demo.local` : "",
    source: "chatbot",
    leadStage: "Active",
    leadStatus: "",
    wallet: 0,
    freeUsedCount: 0,
    remarksHistory: [],
    assignedAgentId: null,
    subscription: { status: "inactive", plan: "Free" },
    createdAt: booking.createdAt || new Date(),
    isChatbotOnly: true,
    isServiceBooked: true,
    conversationStages: ["Demo Booked"],
    demoBooking: {
      id: String(booking._id),
      seminarTime: booking.seminarTime,
      selectedDate:
        normalizeBookingSelectedDate(booking.selectedDate) ||
        booking.selectedDate ||
        "",
      selectedDateLabel: formatDemoSelectedDate(booking.selectedDate),
      status: booking.status || "Not Attended",
      createdAt: booking.createdAt,
      userCreated: Boolean(booking.userCreated),
    },
  };
}

export async function mapDemoBookingsToTableUsers(bookings = []) {
  await dbConnect();

  const phones = [
    ...new Set(
      bookings
        .map((b) => normalizeBookingPhone(b.phone))
        .filter(Boolean),
    ),
  ];

  const registered = phones.length
    ? await User.find({ phone: { $in: phones } })
        .populate("assignedAgentId", "fullName email role mobileNumber")
        .populate("accountManager", "fullName email role mobileNumber")
        .lean()
    : [];

  const registeredByPhone = new Map(
    registered.map((user) => [String(user.phone), user]),
  );

  return bookings.map((booking) => {
    const phone = normalizeBookingPhone(booking.phone);
    const registeredUser = phone ? registeredByPhone.get(phone) : null;
    const base = registeredUser || virtualUserFromDemoBooking(booking);

    return {
      ...base,
      fullName: base.fullName || booking.name,
      phone: base.phone || phone,
      chatbotUserId: base.chatbotUserId || phoneToWaId(phone),
      conversationStages: Array.isArray(base.conversationStages)
        ? [...new Set([...base.conversationStages, "Demo Booked"])]
        : ["Demo Booked"],
      isServiceBooked: true,
      demoBooking: {
        id: String(booking._id),
        seminarTime: booking.seminarTime,
        selectedDate:
          normalizeBookingSelectedDate(booking.selectedDate) ||
          booking.selectedDate ||
          "",
        selectedDateLabel: formatDemoSelectedDate(booking.selectedDate),
        status: booking.status || "Not Attended",
        createdAt: booking.createdAt,
        userCreated: Boolean(booking.userCreated),
      },
    };
  });
}

export async function getDemoBookingMetrics({ filterByAgent = null } = {}) {
  const bookings = await fetchAllDemoBookings({ bypassCache: true });
  const { calendarDate } = getAppDayBounds();

  if (!filterByAgent) {
    const todayBookings = filterBookingsBySelectedDate(bookings, calendarDate);
    return {
      totals: { demoBooked: bookings.length },
      today: { demoBooked: todayBookings.length },
      calendarDate,
    };
  }

  let users = await mapDemoBookingsToTableUsers(bookings);
  users = await filterUsersByAgentEmail(users, filterByAgent);
  const todayUsers = users.filter(
    (user) =>
      normalizeBookingSelectedDate(user.demoBooking?.selectedDate) ===
      calendarDate,
  );

  return {
    totals: { demoBooked: users.length },
    today: { demoBooked: todayUsers.length },
    calendarDate,
  };
}

export async function getDemoBookingMetricUsers({
  period = "total",
  page = 1,
  limit = 70,
  filterByAgent = null,
  role = null,
  autoSync = true,
} = {}) {
  if (period !== "total" && period !== "today") {
    throw new Error("Invalid period");
  }

  let bookings = await fetchAllDemoBookings({ bypassCache: true });
  const { calendarDate } = getAppDayBounds();

  if (period === "today") {
    bookings = filterBookingsBySelectedDate(bookings, calendarDate);
  }

  if (autoSync && bookings.length) {
    await syncPendingDemoBookings({
      bookingIds: bookings.filter((b) => !b.userCreated).map((b) => b._id),
    });
    bookings = await fetchAllDemoBookings({ bypassCache: true });
    if (period === "today") {
      bookings = filterBookingsBySelectedDate(bookings, calendarDate);
    }
  }

  let users = await mapDemoBookingsToTableUsers(bookings);

  if (filterByAgent) {
    users = await filterUsersByAgentEmail(users, filterByAgent);
  }

  const totalUsers = users.length;
  const skip = (page - 1) * limit;
  const pageUsers = users.slice(skip, skip + limit);

  return {
    success: true,
    metricId: "demoBooked",
    period,
    users: pageUsers,
    totalUsers,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    limit,
    calendarDate,
  };
}

export async function getTodayDemoBookingsForAgent(agentEmail) {
  await dbConnect();
  const admin = await Admin.findOne({ email: agentEmail }).select("_id role");
  if (!admin) {
    return { success: false, error: "Agent not found" };
  }

  const bookings = await fetchAllDemoBookings();
  const { calendarDate } = getAppDayBounds();
  const todayBookings = filterBookingsBySelectedDate(bookings, calendarDate);

  if (todayBookings.length) {
    await syncPendingDemoBookings({
      bookingIds: todayBookings.filter((b) => !b.userCreated).map((b) => b._id),
    });
  }

  let users = await mapDemoBookingsToTableUsers(todayBookings);
  users = await filterUsersByAgentEmail(users, agentEmail);

  return {
    success: true,
    calendarDate,
    count: users.length,
    demos: users,
  };
}