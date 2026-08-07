import mongoose from "mongoose";

const franchiseLeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, required: true },
    formId: String,
    fullName: String,
    email: String,
    phone: String,
    city: String,
    occupation: String,
    startTime: String,
    investment: String,
    verified: Boolean,
    createdTime: Date,
    source: { type: String, default: "meta" },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Follow Up", "Inactive", "Onboard"],
    },
    lead_quality: {
      type: String,
      default: "None",
      enum: ["None", "Hot", "Warm", "Cold"],
    },
    assignedFranchiseAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    remarks: [
      {
        text: { type: String, required: true },
        /** Why this remark was picked — kept separate from `text` so remark
         *  filters (exact match on `remarks.text`) keep working. */
        reason: { type: String, default: "" },
        addedBy: { type: String, default: "Admin" },
        addedAt: { type: Date, default: Date.now },
        followUpDate: { type: Date, default: null },
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
        agentName: { type: String, default: "" },
      },
    ],
    callHistory: [
      {
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
        agentName: { type: String, default: "" },
        calledAt: { type: Date, default: Date.now },
        remark: { type: String, default: "" },
      },
    ],
    /** True when lead phone matches an IVR did_number or caller number (see /api/incoming-ivr-franchise). */
    ivrMeInterested: { type: Boolean, default: false },
    /** First time IVR interest was detected (webhook or sync from call log). */
    ivrMeInterestedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const MetaLeadFranchises =
  mongoose.models.MetaLeadFranchises ||
  mongoose.model("MetaLeadFranchises", franchiseLeadSchema);

export default MetaLeadFranchises;
