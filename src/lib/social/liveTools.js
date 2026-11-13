/**
 * Social Media tools that now have their own screens on the website. Their
 * home_sections tiles still say "coming soon" for the app, so the website
 * switches them on here (home page + /social-media).
 */
export const LIVE_SOCIAL_TOOLS = ["social_insights", "comment_auto_reply", "dm_auto_reply", "delete_negative_comments"];

export const SOCIAL_TOOL_ROUTES = {
  social_insights: "/social-media/insights",
  comment_auto_reply: "/social-media/comment-auto-reply",
  dm_auto_reply: "/social-media/dm-auto-reply",
  delete_negative_comments: "/social-media/negative-comments",
};

/**
 * Section with the live tools un-"soon"-ed: lock badge until a Social plan
 * unlocks them (`unlocked`), like the GMB tiles. No "NEW" tags in this section.
 */
export function withLiveSocialTools(section, { unlocked = false } = {}) {
  if (section?.key !== "social_media") return section;
  return {
    ...section,
    items: section.items.map((item) =>
      LIVE_SOCIAL_TOOLS.includes(item.key)
        ? {
            ...item,
            comingSoon: false,
            badge: unlocked ? null : "UNLOCK",
            access: { ...item.access, status: unlocked ? "active" : "locked" },
            action: { type: "url", value: SOCIAL_TOOL_ROUTES[item.key] },
          }
        : { ...item, badge: item.badge === "NEW" ? null : item.badge }
    ),
  };
}
