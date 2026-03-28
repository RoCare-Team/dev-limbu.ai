import mongoose from "mongoose";

const franchiseIvrCallSchema = new mongoose.Schema(
  {
    mobile_no: String,
    agent_mobile: String,
    answered_agent_number: String,
    did_number: String,
    call_status: String,
    uuid: String,
    caller_id_number: String,
    duration: String,
    recording_url: String,
    customer_no_with_prefix: String,
    hangup_cause: String,
    direction: String,
    action_date_time: String,
    call_id: String,
    call_date: String,
    api_page_name: String,
    digit_pressed: String,
    billing_circle: Object,
    campaign_id: String,
    campaign_name: String,
    whatsapp_sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FranchiseIvrCall =
  mongoose.models.FranchiseIvrCall ||
  mongoose.model("FranchiseIvrCall", franchiseIvrCallSchema, "franchise_ivr_calls");

export default FranchiseIvrCall;
