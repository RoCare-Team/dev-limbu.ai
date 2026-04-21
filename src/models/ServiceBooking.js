import mongoose from "mongoose";

const ServiceBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  gstNumber: { type: String },
  planTitle: { type: String, required: true },
  planDuration: { type: String, required: true },
  planType: { type: String, required: true },
  planKey: { type: String },
  /** App userId after checkout flow (USR… / MB-…) */
  userId: { type: String },
  planPrice: { type: String, required: true },
  totalAmount: { type: String, required: true },
  paymentId: { type: String },
  orderId: { type: String },
  status: { type: String, default: "pending" },
  /** website | chatbot | manual-upload — where the booking was initiated */
  bookingSource: {
    type: String,
    enum: ["website", "chatbot", "manual-upload"],
    default: "website",
  },
  /** Chatbot GMB session_id (links payment to /api/gmb/status polling) */
  chatbotSessionId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ServiceBooking || mongoose.model("ServiceBooking", ServiceBookingSchema);