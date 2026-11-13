import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import { graph, graphSafe, grantedPermissions } from "@/lib/social/metaGraph";

const sum = (series) => (series?.values || []).reduce((t, v) => t + (Number(v.value) || 0), 0);

/** Followers, recent posts with likes/comments, and (with read_insights) 28-day reach. */
async function facebookInsights(p) {
  const token = p.pageAccessToken;
  const [info, posts, granted] = await Promise.all([
    graph(p.pageId, token, { params: { fields: "name,fan_count,followers_count,picture{url},link" } }),
    graphSafe(`${p.pageId}/posts`, token, {
      params: {
        limit: 10,
        fields: "message,created_time,permalink_url,full_picture,likes.summary(true).limit(0),comments.summary(true).limit(0),shares",
      },
    }),
    grantedPermissions(p.userAccessToken),
  ]);
  const hasInsights = granted.has("read_insights");
  const reach = hasInsights
    ? await graphSafe(`${p.pageId}/insights`, token, { params: { metric: "page_impressions_unique,page_post_engagements", period: "days_28" } })
    : null;
  const metric = (name) => reach?.data?.find((m) => m.name === name)?.values?.slice(-1)[0]?.value ?? null;

  const list = (posts?.data || []).map((x) => ({
    id: x.id,
    text: x.message || "",
    date: x.created_time,
    url: x.permalink_url,
    image: x.full_picture || null,
    likes: x.likes?.summary?.total_count || 0,
    comments: x.comments?.summary?.total_count || 0,
    shares: x.shares?.count || 0,
  }));
  return {
    platform: "facebook",
    id: p.pageId,
    name: info.name || p.pageName,
    picture: info.picture?.data?.url || null,
    link: info.link || null,
    followers: info.followers_count ?? info.fan_count ?? 0,
    posts: list,
    totals: {
      likes: list.reduce((t, x) => t + x.likes, 0),
      comments: list.reduce((t, x) => t + x.comments, 0),
      shares: list.reduce((t, x) => t + x.shares, 0),
    },
    reach28: metric("page_impressions_unique"),
    engagement28: metric("page_post_engagements"),
    advanced: hasInsights,
  };
}

async function instagramInsights(p) {
  const token = p.pageAccessToken;
  const [info, media, granted] = await Promise.all([
    graph(p.igId, token, { params: { fields: "username,name,followers_count,follows_count,media_count,profile_picture_url" } }),
    graphSafe(`${p.igId}/media`, token, {
      params: { limit: 12, fields: "caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count" },
    }),
    grantedPermissions(p.userAccessToken),
  ]);
  const hasInsights = granted.has("instagram_manage_insights");
  let reach28 = null;
  if (hasInsights) {
    const since = Math.floor((Date.now() - 28 * 864e5) / 1000);
    const r = await graphSafe(`${p.igId}/insights`, token, { params: { metric: "reach", period: "day", since, until: Math.floor(Date.now() / 1000) } });
    reach28 = r?.data?.[0] ? sum(r.data[0]) : null;
  }
  const list = (media?.data || []).map((m) => ({
    id: m.id,
    text: m.caption || "",
    date: m.timestamp,
    url: m.permalink,
    image: m.media_type === "VIDEO" ? m.thumbnail_url || null : m.media_url || null,
    likes: m.like_count || 0,
    comments: m.comments_count || 0,
    shares: 0,
  }));
  return {
    platform: "instagram",
    id: p.igId,
    name: info.username ? `@${info.username}` : p.igUsername,
    picture: info.profile_picture_url || null,
    link: info.username ? `https://instagram.com/${info.username}` : null,
    followers: info.followers_count || 0,
    following: info.follows_count || 0,
    mediaCount: info.media_count || 0,
    posts: list,
    totals: { likes: list.reduce((t, x) => t + x.likes, 0), comments: list.reduce((t, x) => t + x.comments, 0), shares: 0 },
    reach28,
    engagement28: null,
    advanced: hasInsights,
  };
}

/** GET /api/social/insights?userId= — one card of numbers per connected page/account. */
export async function GET(req) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  try {
    await dbConnect();
    const [fb, ig] = await Promise.all([FacebookPage.find({ userId }).lean(), InstagramPage.find({ userId }).lean()]);
    const accounts = await Promise.all([
      ...fb.map((p) => facebookInsights(p).catch((e) => ({ platform: "facebook", id: p.pageId, name: p.pageName, error: e.message }))),
      ...ig.map((p) => instagramInsights(p).catch((e) => ({ platform: "instagram", id: p.igId, name: p.igUsername, error: e.message }))),
    ]);
    return NextResponse.json({ success: true, accounts });
  } catch (err) {
    console.error("social insights:", err);
    return NextResponse.json({ success: false, error: "Could not load insights." }, { status: 500 });
  }
}
