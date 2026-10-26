/**
 * Values the Limbu mobile app understands. Anything outside these lists is
 * rejected by validation, because the app would not know how to render or
 * open it. Ask the app team before adding a new value here.
 */

// icon.type
export const ICON_TYPES = ["brand", "material", "image"];

// icon.value when icon.type === "brand" (real platform logos inside the app)
export const BRAND_ICONS = [
  "google",
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
  "pinterest",
];

// icon.value when icon.type === "material" (Material icon names the app maps)
export const MATERIAL_ICONS = [
  "bar_chart",
  "star",
  "edit_square",
  "chat_bubble_outline",
  "qr_code_2",
  "language",
  "add_photo_alternate",
  "auto_awesome",
  "slideshow",
  "face_retouching_natural",
  "view_in_ar",
  "workspace_premium",
  "description",
  "settings",
  "link",
  "key",
  "edit_note",
  "location_searching",
  "insights",
  "travel_explore",
  "campaign",
  "storefront",
  "trending_up",
  "photo_camera",
  "videocam",
  "schedule",
  "analytics",
  "smart_toy",
  "photo_library",
  "query_stats",
  "monitor_heart",
  "forum",
  "send",
  "delete_sweep",
];

// action.type
export const ACTION_TYPES = ["feature", "plans", "all_services", "url"];

// action.value when action.type === "feature" (screens built into the app)
export const FEATURE_ACTIONS = [
  "gmb_insight",
  "gmb",
  "create_post",
  "reviews",
  "qr",
  "web",
  "keyword_research",
  "local_rank_tracker",
  "text_to_video",
  "image_to_video",
  "ai_avatar_video",
  "cgi_video",
  "assets",
  "competitor_analysis",
  "social_insights",
  "comment_auto_reply",
  "dm_auto_reply",
  "delete_negative_comments",
  "reels",
];

// action.value when action.type === "plans" (tabs of the Service Plans screen)
export const PLAN_TABS = ["services", "ads", "web", "whatsapp"];

// action.value when action.type === "all_services" (sections of Our Services)
export const SERVICE_SECTIONS = ["seo", "outreach", "paid_ads", "website", "app"];

// Badges an admin can set on a tile.
export const BADGES = ["FREE", "NEW", "HOT", "PRO"];

// access.visibleTo — who sees the tile at all.
export const VISIBILITY = ["all", "free_users", "paid_users"];

// Per-user state the API computes for every tile (access.status in the response).
export const ACCESS_STATUS = {
  ACTIVE: "active", // user's current plan includes this service
  FREE: "free", // free for this user (free for all, or free uses left)
  LOCKED: "locked", // needs a plan, or free uses are finished
  OPEN: "open", // no plan rules on this tile (just opens)
};

// Badges the API itself puts on tiles, on top of BADGES.
export const COMPUTED_BADGES = ["ACTIVE", "UPGRADE"];

