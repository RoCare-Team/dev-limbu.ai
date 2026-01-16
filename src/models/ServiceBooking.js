import mongoose from "mongoose";

const ServiceBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  gstNumber: { type: String },
  planTitle: { type: String, required: true },
  planDuration: { type: String, required: true },
  planType: { type: String,required: true },
  planPrice: { type: String, required: true },
  totalAmount: { type: String, required: true },
  paymentId: { type: String },
  orderId: { type: String },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ServiceBooking || mongoose.model("ServiceBooking", ServiceBookingSchema);