import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import User from "@/models/User";
import Admin from "@/models/Admin";

// -------------------------
// DB CONNECT
// -------------------------
async function dbConnect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
    dbName: "demoBookingDB",
  });
}

// -------------------------
// SCHEMA + MODEL
// -------------------------
const DemoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    seminarTime: { type: String, required: true },
    selectedDate: { type: String, required: true },
    userCreated: { type: Boolean, default: false },
    status: { type: String, default: "Not Attended" },
  },
  { timestamps: true, collection: "demoBookings" },
);

const DemoBooking =
  mongoose.models.demoBookings || mongoose.model("demoBookings", DemoSchema);

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
// POST → BOOKING CREATE + USER CREATE + AGENT ASSIGN + WHATSAPP SEND
// Sab kuch ek hi request mein hota hai.
// -------------------------
export async function POST(request) {
  try {
    await dbConnect();

    const { name, phone, seminarTime, selectedDate, status } =
      await request.json();

    // Validation
    if (!name || !phone || !seminarTime || !selectedDate) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 },
      );
    }

    // ── Step 1: Booking save karo ──────────────────────────────────
    const saved = await DemoBooking.create({
      name,
      phone,
      seminarTime,
      selectedDate,
      status: status || "Not Attended",
      userCreated: false,
    });

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
export async function GET() {
  try {
    await dbConnect();
    const allBookings = await DemoBooking.find().sort({ createdAt: -1 });

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
