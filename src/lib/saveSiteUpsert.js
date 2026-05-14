/**
 * Shared POST /api/save-site persistence logic (manual dashboard + chatbot website action).
 * Chatbot payloads with type "chatbot" skip the paid/free multi-site quota on new creates.
 */

import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import User from "@/models/User";

export function slugifyFromBusiness(business) {
  const title = business?.title || "";
  const locality = business?.locality || "";

  return [title, locality]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * @param {object} body — same shape as POST /api/save-site (optional `type`, e.g. "chatbot")
 * @returns {{ ok: true, site: object } | { ok: false, error: string, status: number }}
 */
export async function upsertPublishSite(body) {
  await dbConnect();

  const { business, aiContent, mediaImages, userId, locationId, type } = body ?? {};

  if (!business || !aiContent) {
    return { ok: false, error: "Business and AI content are required", status: 400 };
  }

  if (!business?.phoneNumbers?.primaryPhone && !business?.primaryPhone) {
    return {
      ok: false,
      error:
        "A primary phone number is required in your Google Business Profile to publish a website.",
      status: 400,
    };
  }

  if (!userId) {
    return { ok: false, error: "User ID is required to publish a website.", status: 400 };
  }

  const baseSlug = slugifyFromBusiness(business);
  if (!baseSlug) {
    return {
      ok: false,
      error: "Unable to generate slug from business name and locality.",
      status: 400,
    };
  }

  let existingSite = null;
  if (locationId) {
    existingSite = await Site.findOne({ userId, locationId });
  }
  if (!existingSite) {
    existingSite = await Site.findOne({ userId, slug: baseSlug });
  }

  const applyTypeIfPresent = (siteDoc) => {
    if (typeof type === "string" && type.trim()) {
      siteDoc.type = type.trim();
    }
  };

  if (existingSite) {
    existingSite.business = business;
    existingSite.aiContent = aiContent;
    existingSite.mediaImages = mediaImages || [];
    existingSite.isPublished = true;
    existingSite.updatedAt = new Date();
    if (locationId) {
      existingSite.locationId = locationId;
    }
    applyTypeIfPresent(existingSite);
    await existingSite.save();

    return { ok: true, site: existingSite };
  }

  // New site: WhatsApp/chatbot publishes have no multi-site quota (manual dashboard still limited).
  const isChatbotPublish =
    typeof type === "string" && type.trim().toLowerCase() === "chatbot";

  const user = await User.findOne({ userId }).select("paidPackage packageExpiryDate");

  if (!user) {
    return { ok: false, error: "User not found. Please log in again.", status: 404 };
  }

  if (!isChatbotPublish) {
    const hasPaidPackage = !!user.paidPackage;
    const maxWebsites = hasPaidPackage ? 5 : 2;

    const currentSiteCount = await Site.countDocuments({ userId });
    if (currentSiteCount >= maxWebsites) {
      const message = hasPaidPackage
        ? "You have reached your website limit for this plan (maximum 5 sites). Please upgrade your plan to create more websites."
        : "Aapke free plan mein sirf 2 websites allowed hain. Nayi website publish karne ke liye pehle apna plan upgrade karein.";
      return { ok: false, error: message, status: 403 };
    }
  }

  let finalSlug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await Site.findOne({ slug: finalSlug });
    if (!conflict) break;
    finalSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const createPayload = {
    slug: finalSlug,
    business,
    aiContent,
    mediaImages: mediaImages || [],
    userId,
    locationId,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (typeof type === "string" && type.trim()) {
    createPayload.type = type.trim();
  }

  const site = await Site.create(createPayload);

  return { ok: true, site };
}
