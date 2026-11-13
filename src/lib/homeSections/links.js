// Website page for each app action (see constants.js). Missing → dashboard.
const FEATURE_ROUTES = {
  gmb_insight: "/gmb-insights",
  gmb: "/gmb-health",
  create_post: "/post-management",
  reviews: "/review-management",
  qr: "/get-magic-qr",
  web: "/build-website",
  keyword_research: "/keyword-planner",
  text_to_video: "/video-generation",
  image_to_video: "/video-generation/image-to-video",
  ai_avatar_video: "/video-generation/ai-avatar-video",
  cgi_video: "/video-generation/cgi-video",
  reels: "/video-generation",
  assets: "/assets-management",
  competitor_analysis: "/competitor-analysis",
  social_insights: "/social-media/insights",
  comment_auto_reply: "/social-media/comment-auto-reply",
  dm_auto_reply: "/social-media/dm-auto-reply",
  delete_negative_comments: "/social-media/negative-comments",
};

/** App action -> website href. */
export function actionHref(action) {
  if (!action) return null;
  switch (action.type) {
    case "feature":
      return FEATURE_ROUTES[action.value] || "/dashboard";
    case "plans":
    case "all_services":
      // Website plans have their own page; everything else lives on /pricing.
      return action.value === "web" || action.value === "website"
        ? "/website-development"
        : "/pricing";
    case "url":
      return action.value;
    default:
      return null;
  }
}

// Tools need an account; plans / services pages stay public.
export const needsLogin = (action) => action?.type === "feature";

// Sections with their own website page. The API's viewAll stays as-is for the app.
const SECTION_PAGES = {
  social_media: { href: "/social-media", login: true },
  website_development: { href: "/website-development", login: false },
};

/** Where a home section's "View All" (and headline) should go on the website. */
export function sectionLink(section) {
  const page = SECTION_PAGES[section.key];
  if (page) return { ...page, dedicated: true };
  const href = actionHref(section.viewAll);
  return href ? { href, login: needsLogin(section.viewAll), dedicated: false } : null;
}
