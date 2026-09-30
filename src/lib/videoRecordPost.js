import mongoose from "mongoose";
import Post from "@/models/PostStatus";
import TextToVideo from "@/models/TextToVideo";
import AiAvatarVideo from "@/models/AiAvatarVideo";
import CgiVideo from "@/models/CgiVideo";

/*
 * AI-video pages (Text To Video, AI Avatar Video, CGI Video) keep their own history
 * collections, but the approve → publish flow from /post-management runs on Post
 * documents. These helpers give each history row a linked pending Post.
 */

// GMB rejects summaries longer than this.
const GMB_SUMMARY_LIMIT = 1500;

const clip = (text, max) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text || "");
const captionOf = (captions, platform) => (captions?.[platform]?.caption || "").trim();

/** The generator's per-platform captions become the per-platform descriptions. */
function textToVideoPostFields(record) {
  const captions = record.captions || {};
  const fb = captionOf(captions, "facebook");
  const ig = captionOf(captions, "instagram");
  const li = captionOf(captions, "linkedin");
  const pi = captionOf(captions, "pinterest");

  const script = (record.finalScript || record.content || "").trim();
  const description = fb || ig || script || `${record.businessName} video`;

  return {
    promat: "Text to Video",
    description,
    gmbDescription: clip(description, GMB_SUMMARY_LIMIT),
    fbDescription: fb || description,
    igDescription: ig || description,
    liDescription: li || description,
    piDescription: pi || description,
    pinTitle: (captions.pinterest?.title || "").trim() || record.businessName,
    videoPrompt: script,
  };
}

/** Avatar renders have no generated captions — the spoken script is the copy everywhere. */
function aiAvatarVideoPostFields(record) {
  const script = (record.script || "").trim();
  const description = script || "AI Avatar video";

  return {
    promat: "AI Avatar Video",
    description,
    gmbDescription: clip(description, GMB_SUMMARY_LIMIT),
    fbDescription: description,
    igDescription: description,
    liDescription: description,
    piDescription: description,
    pinTitle: record.characterName || "AI Avatar Video",
    videoPrompt: script,
  };
}

/**
 * CGI ad copy: brand + product + the user's keywords.
 *
 * Ads created before the v1 API also carry AI-written headline/CTA (adCopy).
 * The v1 API returns none, so for new ads the brand line is the copy and the
 * keywords become the hashtags below.
 */
function cgiVideoPostFields(record) {
  const headline = (record.adCopy?.headline || "").trim();
  const cta = (record.adCopy?.cta || "").trim();
  const brand = [record.businessName, record.productName].filter(Boolean).join(" — ");
  const description = [headline, brand, cta].filter(Boolean).join("\n") || `${record.businessName} ad`;

  // Comma-separated keywords → hashtags for the platforms that use them.
  const hashtags = String(record.keywords || "")
    .split(",")
    .map((k) => k.trim().replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean)
    .map((k) => `#${k}`)
    .join(" ");
  const withTags = hashtags ? `${description}\n\n${hashtags}` : description;

  return {
    promat: "CGI Product Video",
    description,
    gmbDescription: clip(description, GMB_SUMMARY_LIMIT),
    fbDescription: withTags,
    igDescription: withTags,
    liDescription: description,
    piDescription: withTags,
    pinTitle: headline || record.productName || record.businessName,
    videoPrompt: headline || brand,
  };
}

/**
 * Returns the Post linked to a history row, creating and linking one if the row
 * has none (older videos, or a save where Post creation failed).
 *
 * Safe against double clicks / two tabs: the link is written only if the row is
 * still unlinked, and a losing racer deletes its own Post and returns the winner's.
 */
async function ensureLinkedPost(Model, record, buildFields) {
  if (record.postId && mongoose.Types.ObjectId.isValid(record.postId)) {
    const existing = await Post.findOne({ _id: record.postId, userId: record.userId }).lean();
    if (existing) return existing;
  }

  const post = await Post.create({
    userId: record.userId,
    aiOutput: record.videoUrl,
    mediaType: "video",
    status: "pending",
    ...buildFields(record),
  });

  const linked = await Model.findOneAndUpdate(
    {
      _id: record._id,
      // Still unlinked, or linked to a Post that no longer exists (the id we just checked).
      $or: [{ postId: null }, { postId: { $exists: false } }, { postId: record.postId || null }],
    },
    { $set: { postId: String(post._id) } },
    { new: true }
  ).lean();

  if (!linked || linked.postId !== String(post._id)) {
    await Post.deleteOne({ _id: post._id });
    const fresh = await Model.findById(record._id).lean();
    if (fresh?.postId && mongoose.Types.ObjectId.isValid(fresh.postId)) {
      return Post.findOne({ _id: fresh.postId, userId: record.userId }).lean();
    }
    return null;
  }

  return post.toObject();
}

export const ensurePostForTextToVideo = (record) =>
  ensureLinkedPost(TextToVideo, record, textToVideoPostFields);

export const ensurePostForAiAvatarVideo = (record) =>
  ensureLinkedPost(AiAvatarVideo, record, aiAvatarVideoPostFields);

export const ensurePostForCgiVideo = (record) =>
  ensureLinkedPost(CgiVideo, record, cgiVideoPostFields);

/** Attaches each row's linked Post as `post` (null when not linked yet / deleted). */
export async function attachLinkedPosts(rows, userId) {
  const postIds = rows
    .map((r) => r.postId)
    .filter((pid) => pid && mongoose.Types.ObjectId.isValid(pid));
  const posts = postIds.length ? await Post.find({ _id: { $in: postIds }, userId }).lean() : [];
  const postsById = new Map(posts.map((p) => [String(p._id), p]));

  return rows.map((r) => ({
    ...r,
    post: r.postId ? postsById.get(String(r.postId)) || null : null,
  }));
}
