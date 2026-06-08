import { NextResponse } from "next/server";
import User from "@/models/User";
import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import {
  fetchAllDemoBookings,
  getDemoBookingModel,
  getDemoBookingsAdminPayload,
  getDemoSlotAvailability,
  invalidateDemoBookingsCache,
  isDemoSlotBooked,
  normalizeBookingPhone,
  normalizeBookingSelectedDate,
} from "@/lib/demoBookings";

// -------------------------
// AGENT PHONE MAPPING
// DB se fullName aayega — exactly yahi keys rakho (case-insensitive match hoga)
// "Imran Ahmed"  → key: "imran ahmed"
// "Jahan singh"  → key: "jahan singh"
// Naya agent aaye toh bas ek line add karo.
// -------------------------
const AGENT_PHONE_MAP = {
  "imran ahmed": "917065021272",
  "jahan singh": "919311587741",
};

function getAgentPhoneByName(fullName) {
  if (!fullName) return null;
  const key = fullName.trim().toLowerCase();
  return AGENT_PHONE_MAP[key] || null;
}

// -------------------------
// ROUND ROBIN — NEXT AGENT
// Active agents ko createdAt ASC se sort karo,
// phir last assigned user ke agent ke baad wala do.
// -------------------------
async function getNextAgent() {
  const agents = await Admin.find({
    role: "agent",
    isActive: true,
  }).sort({ createdAt: 1 });

  if (!agents.length) return null;

  // Sabse recent assigned user dhundo
  const lastAssignedUser = await User.findOne({
    assignedAgentId: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .select("assignedAgentId");

  // Koi user assign nahi hua abhi tak → pehla agent do
  if (!lastAssignedUser) {
    console.log(`Round Robin → First agent: ${agents[0].fullName}`);
    return agents[0];
  }

  const currentIndex = agents.findIndex(
    (a) => a._id.toString() === lastAssignedUser.assignedAgentId?.toString(),
  );

  if (currentIndex === -1) {
    console.warn("Last agent active list mein nahi mila → agents[0] pe reset");
    return agents[0];
  }

  const nextIndex = (currentIndex + 1) % agents.length;
  console.log(`Round Robin → Next agent: ${agents[nextIndex].fullName}`);
  return agents[nextIndex];
}

// -------------------------
// WHATSAPP TEMPLATE SENDER
// Agent ko lead assign hone ka template bhejta hai.
// Template name: agent_demo_alert
// Params order: [agentName, customerName, selectedDate, seminarTime, customerPhone]
// -------------------------
async function sendAgentLeadAssignedTemplate({
  agentName,
  agentPhone,
  customerName,
  customerPhone,
  selectedDate,
  seminarTime,
}) {
  // Number clean karo — sirf digits, aur 91 prefix ensure karo
  const digits = agentPhone.replace(/\D/g, "");
  const finalNumber = digits.startsWith("91") ? digits : `91${digits}`;

  console.log(`📲 WhatsApp bhej raha hoon → ${agentName} (${finalNumber})`);

  const payload = {
    apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,
    campaignName: "agent_demo_alert",
    destination: finalNumber,
    userName: "Limbu AI",
    templateParams: [
      agentName, // {{1}} Agent ka naam
      customerName, // {{2}} Customer ka naam
      selectedDate, // {{3}} Demo date
      seminarTime, // {{4}} Seminar time
      customerPhone, // {{5}} Customer phone
    ],
    source: "api",
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {},
  };

  const res = await fetch("https://whatsapp.limbu.ai/api/campaigns/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const resText = await res.text();

  if (!res.ok) {
    console.error(`❌ WhatsApp API Error [${res.status}]:`, resText);
    throw new Error(`WhatsApp API failed: ${res.status} — ${resText}`);
  }

  console.log(
    `✅ WhatsApp sent → ${agentName} (${finalNumber}) | Response: ${resText}`,
  );
}

// -------------------------
// SYNC → USER CREATE + AGENT ASSIGN + TEMPLATE SEND
// GET se alag rakha hai taaki dashboard refresh pe sync na chale.
// Is route ko cron job ya webhook se call karo.
// Example: POST /api/demo-bookings/sync
// -------------------------
export async function SYNC() {
  try {
    await dbConnect();
    const DemoBooking = await getDemoBookingModel();

    // Sirf wo bookings lo jinke liye user abhi tak create nahi hua.
    // Date filter nahi hai — timezone issue se bachne ke liye.
    const pendingBookings = await DemoBooking.find({ userCreated: false });

    const results = { success: 0, skipped: 0, errors: 0 };

    for (const booking of pendingBookings) {
      try {
        const phone = normalizeBookingPhone(booking.phone);
        const existingUser = phone
          ? await User.findOne({ phone })
          : await User.findOne({ phone: booking.phone });

        if (!existingUser) {
          const assignedAgent = await getNextAgent();
          const totalUsers = await User.countDocuments();

          await User.create({
            userId: `USR${Date.now()}${totalUsers + 1}`,
            fullName: booking.name,
            phone: booking.phone,
            email: `${booking.phone}@demo.local`,
            source: "chatbot",
            leadStage: "Active",
            leadStatus: "",
            assignedAgentId: assignedAgent?._id || null,
            accountManager: assignedAgent?._id || null,
            accountManagerName: assignedAgent?.fullName || null,
            isServiceBooked: true,
          });

          // Agent ka phone AGENT_PHONE_MAP se lo — name ke basis pe.
          // Agar agent map mein nahi hai toh template skip hoga (silently).
          const agentPhone = getAgentPhoneByName(assignedAgent?.fullName);

          if (agentPhone) {
            await sendAgentLeadAssignedTemplate({
              agentName: assignedAgent.fullName,
              agentPhone,
              customerName: booking.name,
              customerPhone: booking.phone,
              selectedDate: booking.selectedDate,
              seminarTime: booking.seminarTime,
            });
            console.log(
              `Template sent → Agent: ${assignedAgent.fullName} (${agentPhone})`,
            );
          } else {
            console.warn(
              `Agent "${assignedAgent?.fullName}" AGENT_PHONE_MAP mein nahi hai. Template skip kiya.`,
            );
          }

          results.success++;
        } else {
          // Phone already registered hai — user create skip, sirf flag update karo
          results.skipped++;
        }

        // Flag lagao taaki dobara process na ho
        booking.userCreated = true;
        await booking.save();
      } catch (err) {
        results.errors++;
        console.error("Sync Error for booking:", booking._id, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sync complete",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// -------------------------
// POST → CREATE BOOKING
// -------------------------
export async function POST(request) {
  try {
    await dbConnect();
    const DemoBooking = await getDemoBookingModel();
    const { name, phone, seminarTime, selectedDate, status } =
      await request.json();

    // Validation
    if (!name || !phone || !seminarTime || !selectedDate) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 },
      );
    }

    const normalizedDate = normalizeBookingSelectedDate(selectedDate);
    if (await isDemoSlotBooked(normalizedDate, seminarTime)) {
      const availability = await getDemoSlotAvailability(normalizedDate);
      const alternatives = availability.slots
        .filter((slot) => !slot.booked)
        .map((slot) => slot.label);
      return NextResponse.json(
        {
          success: false,
          message: `This time slot is already booked. Please choose another time.`,
          slotBooked: true,
          availableSlots: alternatives,
        },
        { status: 409 },
      );
    }

    const saved = await DemoBooking.create({
      name,
      phone,
      seminarTime,
      selectedDate: normalizedDate || selectedDate,
      status: status || "Not Attended",
      userCreated: false,
    });
    invalidateDemoBookingsCache();

    console.log(`📝 Booking saved → ${name} (${phone})`);

    // ── Step 2: User create + Agent assign + WhatsApp ──────────────
    // Sync error se booking fail nahi hogi — alag try/catch hai.
    try {
      const existingUser = await User.findOne({ phone });

      if (existingUser) {
        // Phone already registered — user create skip
        console.log(`ℹ️ Phone ${phone} already exists. User create skip.`);
        saved.userCreated = true;
        await saved.save();
      } else {
        // Agent round robin se lo
        const assignedAgent = await getNextAgent();

        if (!assignedAgent) {
          console.warn(
            "⚠️ Koi active agent nahi mila. User bina agent ke create hoga.",
          );
        }

        // User create karo
        const totalUsers = await User.countDocuments();
        await User.create({
          userId: `USR${Date.now()}${totalUsers + 1}`,
          fullName: name,
          phone,
          email: `${phone}@demo.com`,
          source: "chatbot",
          leadStage: "Active",
          leadStatus: "",
          assignedAgentId: assignedAgent?._id || null,
          accountManager: assignedAgent?._id || null,
          accountManagerName: assignedAgent?.fullName || null,
          isServiceBooked: true,
        });

        console.log(
          `✅ User created → ${name} | Agent: ${assignedAgent?.fullName || "None"}`,
        );

        // WhatsApp template bhejo — sirf tab jab agent mila ho
        if (assignedAgent) {
          const agentPhone = getAgentPhoneByName(assignedAgent.fullName);

          if (agentPhone) {
            await sendAgentLeadAssignedTemplate({
              agentName: assignedAgent.fullName,
              agentPhone,
              customerName: name,
              customerPhone: phone,
              selectedDate,
              seminarTime,
            });
          } else {
            // Agent DB mein hai lekin AGENT_PHONE_MAP mein nahi
            console.warn(
              `⚠️ Agent "${assignedAgent.fullName}" AGENT_PHONE_MAP mein nahi hai.\n` +
                `   Fix: AGENT_PHONE_MAP mein "${assignedAgent.fullName.trim().toLowerCase()}" key add karo.`,
            );
          }
        }

        // Booking flag update karo
        saved.userCreated = true;
        await saved.save();
      }
    } catch (syncErr) {
      // Sync fail — booking toh saved hai, sirf log karo
      console.error(
        "⚠️ Sync/WhatsApp error (booking saved hai):",
        syncErr.message,
      );
    }

    // ── Response ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Demo booked successfully!",
      data: {
        id: saved._id,
        name: saved.name,
        phone: saved.phone,
        seminarTime: saved.seminarTime,
        selectedDate: saved.selectedDate,
        status: saved.status,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /demo-bookings error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// -------------------------
// GET → FETCH ALL BOOKINGS
// -------------------------
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const slotsOnly = searchParams.get("slots") === "1";

    if (slotsOnly && date) {
      const availability = await getDemoSlotAvailability(date);
      return NextResponse.json({
        success: true,
        ...availability,
      });
    }

    if (searchParams.get("admin") === "1") {
      const payload = await getDemoBookingsAdminPayload();
      return NextResponse.json(payload);
    }

    const allBookings = await fetchAllDemoBookings({ bypassCache: true });

    if (date) {
      const normalized = normalizeBookingSelectedDate(date);
      const filtered = allBookings.filter(
        (booking) => normalizeBookingSelectedDate(booking.selectedDate) === normalized,
      );
      return NextResponse.json({
        success: true,
        count: filtered.length,
        date: normalized,
        data: filtered,
      });
    }

    return NextResponse.json({
      success: true,
      count: allBookings.length,
      data: allBookings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// -------------------------
// DELETE → REMOVE BOOKING
// -------------------------
export async function DELETE(request) {
  try {
    await dbConnect();
    const DemoBooking = await getDemoBookingModel();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required." },
        { status: 400 },
      );
    }

    const deleted = await DemoBooking.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully!",
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// -------------------------
// PUT → UPDATE STATUS
// -------------------------
export async function PUT(request) {
  try {
    await dbConnect();
    const DemoBooking = await getDemoBookingModel();
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "ID aur status dono required hain." },
        { status: 400 },
      );
    }

    const updated = await DemoBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status Updated!",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
