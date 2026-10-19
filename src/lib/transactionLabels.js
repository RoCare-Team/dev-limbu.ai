/**
 * Human-readable names for wallet Transaction `reason` codes.
 * Reasons are free-form strings written by many routes over time, so unknown
 * ones fall back to a tidied-up version of the raw code.
 */
const REASON_LABELS = {
  "post-on-gmb": "Post to GMB",
  "post-on-gmb-batch": "Post to GMB (multiple locations)",
  gmb_post_charge: "GMB post charge",
  gmb_schedule_charge: "GMB schedule charge",
  multi_platform_schedule: "Multi-platform schedule",
  facebook_post_charge: "Facebook post charge",
  "post-on-youtube": "Post to YouTube",

  image_generated: "AI image generated",
  video_generated: "Image to Video",
  video_generated_texttovideo: "Text to Video",
  video_generated_ai_avatar: "AI Avatar Video",
  video_generated_cgi: "CGI Product Video",

  "refund-post-failed-partial": "Refund — GMB post failed",
  "refund-post-youtube-failed": "Refund — YouTube post failed",
  refund_video_failed: "Refund — video failed",
  refund_failed_generation: "Refund — generation failed",

  feature_access: "Feature access (GBP tool)",

  wallet_add: "Wallet recharge",
  wallet_recharge: "Wallet recharge",
  "wallet reacharge": "Wallet recharge",
  recharge: "Wallet recharge",
  "top up": "Wallet recharge",
  add: "Coins added",
  subscription_purchase: "Subscription purchased",
  wallet_deduct: "Coins deducted",

  admin: "Added by admin",
  "admin add": "Added by admin",
  "admin by bonus": "Bonus from admin",
  "admin add according ur plan": "Plan coins from admin",
};

export function transactionLabel(reason) {
  const raw = String(reason || "").trim();
  if (!raw) return "Wallet operation";
  const known = REASON_LABELS[raw.toLowerCase()];
  if (known) return known;
  const tidy = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return tidy.charAt(0).toUpperCase() + tidy.slice(1);
}
