import mongoose from "mongoose";
import { PLATFORM_KEYS } from "@/lib/franchiseLeadSources";

/**
 * A connected lead platform for one franchise. Configured from
 * /franchise-panel/settings; leads arrive either via the ingest webhook
 * (ingestKey) or by pulling from the platform (Meta sync).
 */
const FranchiseLeadSourceSchema = new mongoose.Schema(
  {
    franchiseCode: { type: String, required: true, trim: true },

    /** Display name — also becomes the leadTags marker on every lead. */
    name: { type: String, required: true, trim: true },

    platform: { type: String, required: true, enum: PLATFORM_KEYS },

    /** Platform-specific mandatory fields (formId, accessToken, pageId, ...) */
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /** Applied to every lead this source creates. */
    defaultLeadStage: {
      type: String,
      enum: ["Active", "Follow Up", "Inactive", "Onboard"],
      default: "Active",
    },
    defaultLeadStatus: {
      type: String,
      enum: ["", "Hot", "Warm", "Cold"],
      default: "",
    },
    /** round-robin across active team members, or always the same member. */
    assignMode: {
      type: String,
      enum: ["round-robin", "fixed", "unassigned"],
      default: "round-robin",
    },
    fixedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchiseTeam",
      default: null,
    },

    /** Shared secret for the public ingest webhook. */
    ingestKey: { type: String, required: true, unique: true },

    isActive: { type: Boolean, default: true },

    // ── Observability ────────────────────────────────────────────
    totalLeads: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    lastLeadAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    lastSyncCursor: { type: String, default: null },
    lastError: { type: String, default: "" },

    createdByEmail: { type: String, default: "" },
  },
  { timestamps: true },
);

FranchiseLeadSourceSchema.index({ franchiseCode: 1, isActive: 1 });

export default mongoose.models.FranchiseLeadSource ||
  mongoose.model("FranchiseLeadSource", FranchiseLeadSourceSchema);
