import mongoose from "mongoose";

const franchiseDemoBookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true, required: true },

    leadId: { type: String, default: "" }, // MetaLeadFranchises.leadId se link (optional)

    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    clientEmail: { type: String, default: "" },

    agentId: { type: String, required: true },   // FranchiseDemoAgent.js ka agentId
    agentName: { type: String, required: true },
    agentPhone: { type: String, required: true },

    date: { type: String, required: true },       // "2026-07-28"
    slotTime: { type: String, required: true },   // "10:00-11:00"

    meetLink: { type: String, default: "" },   // auto-generated Meet link (ya agent fallback)
    calendarEventId: { type: String, default: "" }, // Google Calendar event id (cancel pe delete ke liye)

    status: {
      type: String,
      default: "Booked",
      enum: ["Booked", "Completed", "Cancelled", "NoShow"],
    },

    whatsapp: {
      clientSent: { type: Boolean, default: false },
      agentSent: { type: Boolean, default: false },
      clientMsgId: { type: String, default: "" },
      agentMsgId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Ye sabse important line hai:
// Same date + slotTime + agentId pe 2 "Booked" entries kabhi nahi ban sakti (DB level safety)
// Cancelled/Completed bookings pe restriction nahi lagega, isliye partialFilterExpression use kiya
franchiseDemoBookingSchema.index(
  { date: 1, slotTime: 1, agentId: 1 },
  { unique: true, partialFilterExpression: { status: "Booked" } }
);

const FranchiseDemoBooking =
  mongoose.models.FranchiseDemoBooking ||
  mongoose.model("FranchiseDemoBooking", franchiseDemoBookingSchema);

export default FranchiseDemoBooking;