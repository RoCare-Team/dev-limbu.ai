import mongoose from "mongoose";

// Franchise demo agents — ab DB me. Naya agent add karna ho to seedhe is
// collection me document daal do (bas agentName + agentPhone zaroori hai).
// Booking me agent ki pehchaan document ke _id se hoti hai.
const franchiseDemoAgentSchema = new mongoose.Schema(
  {
    agentName: { type: String, required: true },
    agentPhone: { type: String, required: true }, // 91XXXXXXXXXX ya 10-digit
    agentEmail: { type: String, default: "" },    // optional: calendar invite attendee
    // fallback Meet link (agar auto Google Meet generation fail ho). Optional.
    meetLink: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FranchiseDemoAgent =
  mongoose.models.FranchiseDemoAgent ||
  mongoose.model("FranchiseDemoAgent", franchiseDemoAgentSchema);

export default FranchiseDemoAgent;
