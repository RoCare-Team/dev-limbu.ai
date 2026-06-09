/**
 * Shared POST /api/save-site persistence logic (manual dashboard + chatbot website action).
 * Chatbot payloads with type "chatbot" skip the paid/free multi-site quota on new creates.
 */

import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import User from "@/models/User";
import {
  resolveSiteUserId,
  resolvePrimaryPhoneForSite,
} from "@/lib/resolveSiteUserId";

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

// ✅ Yahan apne unlimited users ke IDs daalo
const UNLIMITED_USER_IDS = ["USR1763361446609", "USR1761994068831"];

export async function upsertPublishSite(body) {
  await dbConnect();

  const {
    business,
    aiContent,
    mediaImages,
    userId,
    locationId,
    type,
    phone,
    email,
  } = body ?? {};

  if (!business || !aiContent) {
    return {
      ok: false,
      error: "Business and AI content are required",
      status: 400,
    };
  }

  const isChatbotPublish =
    typeof type === "string" && type.trim().toLowerCase() === "chatbot";

  let businessForSave = business;
  if (!business?.phoneNumbers?.primaryPhone && !business?.primaryPhone) {
    if (isChatbotPublish) {
      const fallbackPhone = resolvePrimaryPhoneForSite({ phone, userId });
      if (fallbackPhone) {
        businessForSave = {
          ...business,
          primaryPhone: fallbackPhone,
          phoneNumbers: { primaryPhone: fallbackPhone },
        };
      }
    }
  }

  const effectiveUserId = resolveSiteUserId({
    userId,
    phone:
      phone ||
      businessForSave?.primaryPhone ||
      businessForSave?.phoneNumbers?.primaryPhone,
    email,
  });

  if (!effectiveUserId) {
    return {
      ok: false,
      error: "User ID or phone is required to publish a website.",
      status: 400,
    };
  }

  const baseSlug = slugifyFromBusiness(businessForSave);
  if (!baseSlug) {
    return {
      ok: false,
      error: "Unable to generate slug from business name and locality.",
      status: 400,
    };
  }

  let existingSite = null;
  if (locationId) {
    existingSite = await Site.findOne({ userId: effectiveUserId, locationId });
  }
  if (!existingSite) {
    existingSite = await Site.findOne({
      userId: effectiveUserId,
      slug: baseSlug,
    });
  }

  const applyTypeIfPresent = (siteDoc) => {
    if (typeof type === "string" && type.trim()) {
      siteDoc.type = type.trim();
    }
  };

  if (existingSite) {
    existingSite.business = businessForSave;
    existingSite.aiContent = aiContent;
    existingSite.mediaImages =
      Array.isArray(mediaImages) && mediaImages.length > 0
        ? mediaImages.filter(Boolean).slice(0, 13)
        : (existingSite.mediaImages || []).filter(Boolean).slice(0, 13);
    existingSite.isPublished = true;
    existingSite.updatedAt = new Date();
    if (locationId) existingSite.locationId = locationId;
    applyTypeIfPresent(existingSite);
    await existingSite.save();
    return { ok: true, site: existingSite };
  }

  // ✅ Unlimited exception check — pehle hi skip kar do quota check
  const isUnlimitedUser = UNLIMITED_USER_IDS.includes(effectiveUserId);

  // New site quota check — chatbot aur unlimited users dono skip karte hain
  if (!isChatbotPublish && !isUnlimitedUser) {
    const user = await User.findOne({ userId: effectiveUserId }).select(
      "paidPackage packageExpiryDate",
    );

    if (!user) {
      return {
        ok: false,
        error: "User not found. Please log in again.",
        status: 404,
      };
    }

    const hasPaidPackage = !!user.paidPackage;
    const maxWebsites = hasPaidPackage ? 5 : 2;

    const currentSiteCount = await Site.countDocuments({
      userId: effectiveUserId,
    });
    if (currentSiteCount >= maxWebsites) {
      const message = hasPaidPackage
        ? "You have reached your website limit for this plan (maximum 5 sites). Please upgrade your plan to create more websites."
        : "Aapke free plan mein sirf 2 websites allowed hain. Nayi website publish karne ke liye pehle apna plan upgrade karein.";
      return { ok: false, error: message, status: 403 };
    }
  }

  let finalSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const conflict = await Site.findOne({ slug: finalSlug });
    if (!conflict) break;
    finalSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const createPayload = {
    slug: finalSlug,
    business: businessForSave,
    aiContent,
    mediaImages:
      Array.isArray(mediaImages) && mediaImages.length > 0
        ? mediaImages.filter(Boolean).slice(0, 13)
        : [],
    userId: effectiveUserId,
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
