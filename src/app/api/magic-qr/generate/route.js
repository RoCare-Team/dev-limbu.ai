import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  findGmbSessionByPhone,
  normalizePhone,
  toFullLocationId,
} from "@/lib/gmbSessionStore";
import { generateMagicQrCard } from "@/lib/magicQrCardGenerator";
import MagicQR from "@/models/MagicQR";
import { uploadToS3 } from "@/utils/s3Config";
import { generateUniversalSlug } from "@/utils/slugify";

export const maxDuration = 300;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const toShortLocationId = (locationId) =>
  String(locationId || "").replace(/^locations\//, "");

const getLocationIdentifier = (location = {}) =>
  String(
    location.locationId ||
      location.locationResourceName ||
      location.name ||
      "",
  );

const buildUniqueReviewSlug = (location, locations) => {
  if (!location) return "";

  const baseSlug = generateUniversalSlug(location);
  if (!baseSlug) return "";

  const currentId = getLocationIdentifier(location);
  const hasConflict = (locations || []).some((loc) => {
    const locId = getLocationIdentifier(loc);
    if (!loc || !locId || locId === currentId) return false;
    return generateUniversalSlug(loc) === baseSlug;
  });

  if (!hasConflict) return baseSlug;

  return `${baseSlug}-${toShortLocationId(currentId).substring(0, 5)}`;
};

const buildReviewUrl = (location, locations) => {
  const slug = buildUniqueReviewSlug(location, locations);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.limbu.ai"
  ).replace(/\/$/, "");

  return `${siteUrl}/reviews/${slug}`;
};

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const action = String(body?.action || "").trim();
    const phone = normalizePhone(body?.phone || "");
    const locationId = String(body?.locationId || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (action !== "magic_qr") {
      return NextResponse.json(
        { error: "action must be magic_qr" },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    if (!locationId) {
      return NextResponse.json(
        { error: "locationId is required" },
        { status: 400 },
      );
    }

    const sessionDoc = await findGmbSessionByPhone(phone);
    if (!sessionDoc || sessionDoc.status !== "success") {
      return NextResponse.json(
        { error: "Business not connected" },
        { status: 404 },
      );
    }

    if (email && sessionDoc.userEmail && sessionDoc.userEmail !== email) {
      return NextResponse.json(
        { error: "Email does not match connected business" },
        { status: 403 },
      );
    }

    const fullLocationId = toFullLocationId(locationId);
    const locations = sessionDoc.locationsData || [];
    const location = locations.find(
      (loc) =>
        loc.locationResourceName === fullLocationId ||
        loc.locationResourceName === locationId ||
        toShortLocationId(loc.locationResourceName) ===
          toShortLocationId(locationId),
    );

    if (!location) {
      return NextResponse.json(
        { error: "Location not found for this business" },
        { status: 404 },
      );
    }

    await dbConnect();

    const businessTitle = location.title || "Business";
    const locality = location.locality || "";
    const shortLocationId = toShortLocationId(locationId);
    const reviewUrl = buildReviewUrl(location, locations);

    const cardBuffer = await generateMagicQrCard(businessTitle, reviewUrl);
    const folder = `magic-qrs/${slugify(businessTitle)}`;
    const fileName = `${Date.now()}-${slugify(locality || "hq")}-qr-card.png`;

    const s3Result = await uploadToS3(
      cardBuffer,
      fileName,
      "image/png",
      folder,
    );

    if (!s3Result.success) {
      return NextResponse.json(
        { error: s3Result.error || "S3 upload failed" },
        { status: 500 },
      );
    }

    await MagicQR.findOneAndUpdate(
      { locationId: shortLocationId },
      {
        userEmail: email || sessionDoc.userEmail || "",
        businessTitle,
        locality,
        locationId: shortLocationId,
        s3ImageUrl: s3Result.url,
        reviewUrl,
        status: "generated",
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ url: s3Result.url });
  } catch (error) {
    console.error("Magic QR generate API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
