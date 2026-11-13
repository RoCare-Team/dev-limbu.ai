/**
 * Runs one user's social automation (called by /api/cron/social-automation):
 *  1. negative comments  -> hidden or deleted      (settings.moderation)
 *  2. other new comments -> AI reply               (settings.commentReply)
 *  3. new DMs            -> AI reply within 24h    (settings.dmReply)
 * on every connected Facebook page and Instagram account. Each handled item is
 * written to SocialAutomationLog, which also stops it being handled twice.
 * Server-only.
 */
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import SocialAutomationLog from "@/models/SocialAutomationLog";
import { graph, grantedPermissions, FEATURE_PERMISSIONS } from "./metaGraph";
import { classifyComment, draftReply } from "./socialAi";

const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000; // comments: last 3 days
const DM_WINDOW_MS = 24 * 60 * 60 * 1000; // Meta only allows replies within 24h
const MAX_ACTIONS_PER_RUN = 25;

const recent = (iso, ms) => iso && Date.now() - new Date(iso).getTime() < ms;
const hasAll = (granted, list) => list.every((p) => granted.has(p));

async function handled(objectId) {
  return !!(await SocialAutomationLog.exists({ objectId }));
}

async function log(entry) {
  try {
    await SocialAutomationLog.create(entry);
  } catch (err) {
    if (err.code !== 11000) throw err; // duplicate = another run already did it
  }
}

/**
 * Accounts with tokens and which features their permissions allow:
 * [{ platform, id, name, token, sendId, allow: { comments, dms, moderation } }]
 */
export async function automationAccounts(userId) {
  const [fbPages, igPages] = await Promise.all([FacebookPage.find({ userId }).lean(), InstagramPage.find({ userId }).lean()]);
  const permsCache = new Map();
  const perms = async (token) => {
    if (!permsCache.has(token)) permsCache.set(token, await grantedPermissions(token));
    return permsCache.get(token);
  };
  const out = [];
  for (const p of fbPages) {
    const g = await perms(p.userAccessToken);
    out.push({
      platform: "facebook",
      id: p.pageId,
      name: p.pageName || "Facebook page",
      token: p.pageAccessToken,
      sendId: p.pageId,
      allow: Object.fromEntries(Object.entries(FEATURE_PERMISSIONS).map(([f, need]) => [f, hasAll(g, need.facebook)])),
    });
  }
  for (const p of igPages) {
    const g = await perms(p.userAccessToken);
    out.push({
      platform: "instagram",
      id: p.igId,
      name: p.igUsername ? `@${p.igUsername}` : "Instagram account",
      username: p.igUsername,
      token: p.pageAccessToken,
      sendId: p.pageId, // IG DMs are sent through the linked Facebook page
      allow: Object.fromEntries(Object.entries(FEATURE_PERMISSIONS).map(([f, need]) => [f, hasAll(g, need.instagram)])),
    });
  }
  return out;
}

/** New comments on the account's latest posts: [{ id, text, authorName, authorIsOwner, hasOwnerReply, postId, permalink }]. */
async function recentComments(acc) {
  if (acc.platform === "facebook") {
    const feed = await graph(`${acc.id}/feed`, acc.token, {
      params: {
        limit: 10,
        fields: "id,permalink_url,comments.limit(25).order(reverse_chronological){id,message,from,created_time,comments.limit(5){from}}",
      },
    });
    return (feed.data || []).flatMap((post) =>
      (post.comments?.data || [])
        .filter((c) => recent(c.created_time, LOOKBACK_MS))
        .map((c) => ({
          id: c.id,
          text: c.message || "",
          authorName: c.from?.name || "",
          authorIsOwner: c.from?.id === acc.id,
          hasOwnerReply: (c.comments?.data || []).some((r) => r.from?.id === acc.id),
          postId: post.id,
          permalink: post.permalink_url,
        }))
    );
  }
  const media = await graph(`${acc.id}/media`, acc.token, {
    params: { limit: 10, fields: "id,permalink,comments.limit(25){id,text,username,timestamp,replies{username}}" },
  });
  return (media.data || []).flatMap((m) =>
    (m.comments?.data || [])
      .filter((c) => recent(c.timestamp, LOOKBACK_MS))
      .map((c) => ({
        id: c.id,
        text: c.text || "",
        authorName: c.username || "",
        authorIsOwner: !!acc.username && c.username === acc.username,
        hasOwnerReply: (c.replies?.data || []).some((r) => r.username === acc.username),
        postId: m.id,
        permalink: m.permalink,
      }))
  );
}

async function hideComment(acc, id, action) {
  if (action === "delete") return graph(id, acc.token, { method: "DELETE" });
  return graph(id, acc.token, { method: "POST", params: acc.platform === "facebook" ? { is_hidden: true } : { hide: true } });
}

/** Shows a hidden comment again (owner pressed "Unhide"). */
export async function unhideComment(acc, id) {
  return graph(id, acc.token, { method: "POST", params: acc.platform === "facebook" ? { is_hidden: false } : { hide: false } });
}

async function replyToComment(acc, id, message) {
  return graph(acc.platform === "facebook" ? `${id}/comments` : `${id}/replies`, acc.token, { method: "POST", params: { message } });
}

/** Conversations whose last message is from the customer, inside the 24h window. */
async function pendingDms(acc) {
  if (!acc.sendId) return [];
  const data = await graph(`${acc.sendId}/conversations`, acc.token, {
    params: { platform: acc.platform === "facebook" ? "messenger" : "instagram", limit: 15, fields: "id,messages.limit(1){id,message,from,created_time}" },
  });
  return (data.data || [])
    .map((c) => c.messages?.data?.[0])
    .filter((m) => m && m.message && m.from?.id && m.from.id !== acc.id && m.from.id !== acc.sendId && recent(m.created_time, DM_WINDOW_MS))
    .map((m) => ({ id: m.id, text: m.message, authorName: m.from.name || m.from.username || "", senderId: m.from.id }));
}

async function sendDm(acc, recipientId, text) {
  return graph(`${acc.sendId}/messages`, acc.token, {
    method: "POST",
    params: { recipient: { id: recipientId }, message: { text }, messaging_type: "RESPONSE" },
  });
}

/** Runs everything that is switched on for this user. Returns { actions, errors }. */
export async function runSocialAutomation(settings) {
  const { userId } = settings;
  const accounts = await automationAccounts(userId);
  const ai = { business: settings.businessInfo, businessName: settings.businessName };
  let actions = 0;
  const errors = [];

  for (const acc of accounts) {
    if (actions >= MAX_ACTIONS_PER_RUN) break;
    const on = (feature) => settings[feature]?.enabled && settings[feature]?.platforms?.[acc.platform] !== false;
    const base = { userId, platform: acc.platform, pageId: acc.id, accountName: acc.name };

    // 1 + 2: comments
    const moderate = on("moderation") && acc.allow.moderation;
    const reply = on("commentReply") && acc.allow.comments;
    if (moderate || reply) {
      try {
        for (const c of await recentComments(acc)) {
          if (actions >= MAX_ACTIONS_PER_RUN) break;
          if (c.authorIsOwner || !c.text.trim() || (await handled(c.id))) continue;
          const entry = { ...base, objectId: c.id, postId: c.postId, permalink: c.permalink, authorName: c.authorName, text: c.text };

          if (moderate) {
            const verdict = await classifyComment(c.text, { blockedWords: settings.moderation.blockedWords, useAi: settings.moderation.useAi });
            if (verdict.negative) {
              await hideComment(acc, c.id, settings.moderation.action);
              await log({ ...entry, kind: settings.moderation.action === "delete" ? "deleted" : "hidden", reason: verdict.reason });
              actions++;
              continue;
            }
          }
          if (reply && !c.hasOwnerReply) {
            const text = await draftReply(c.text, { kind: "comment", tone: settings.commentReply.tone, authorName: c.authorName, ...ai });
            await replyToComment(acc, c.id, text);
            await log({ ...entry, kind: "comment_reply", reply: text });
            actions++;
          } else if (moderate) {
            await log({ ...entry, kind: "skipped", reason: "Clean comment" }); // don't classify it again
          }
        }
      } catch (err) {
        errors.push(`${acc.name} comments: ${err.message}`);
      }
    }

    // 3: DMs
    if (on("dmReply") && acc.allow.dms) {
      try {
        for (const m of await pendingDms(acc)) {
          if (actions >= MAX_ACTIONS_PER_RUN) break;
          if (await handled(m.id)) continue;
          const text = await draftReply(m.text, { kind: "dm", tone: settings.dmReply.tone, authorName: m.authorName, ...ai });
          await sendDm(acc, m.senderId, text);
          await log({ ...base, kind: "dm_reply", objectId: m.id, authorName: m.authorName, text: m.text, reply: text });
          actions++;
        }
      } catch (err) {
        errors.push(`${acc.name} messages: ${err.message}`);
      }
    }
  }
  return { actions, errors };
}
