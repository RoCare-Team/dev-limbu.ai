import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import { toWhatsAppDigits } from "@/utils/whatsappLink";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/** Same Bearer-JWT auth as the other admin routes. Returns a response on failure, else null. */
function requireAdmin(req) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    jwt.verify(auth.split(" ")[1], JWT_SECRET);
    return null;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }
}

/** `business` is a free-form Object — the phone lives under either key depending on who wrote it. */
function readPhone(business) {
  return business?.phoneNumbers?.primaryPhone || business?.primaryPhone || "";
}

/**
 * "ok"              — already dialable with a country code
 * "no_country_code" — stored as a local number (leading 0 / bare 10 digits)
 * "invalid"         — too short to be a real number
 * "missing"         — no phone saved at all
 */
function phoneStatus(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "missing";
  const e164 = toWhatsAppDigits(raw);
  if (!e164) return "invalid";
  // Normalising changed the digits ⇒ what was stored had no usable country code.
  return digits === e164 ? "ok" : "no_country_code";
}

/** Stored in +E.164 so tel: links and the wa.me builder both work off one value. */
function normalizedPhone(raw) {
  const e164 = toWhatsAppDigits(raw);
  return e164 ? `+${e164}` : "";
}

function serialize(site) {
  const business = site.business || {};
  const phone = readPhone(business);
  return {
    _id: String(site._id),
    slug: site.slug,
    userId: site.userId,
    isPublished: site.isPublished,
    type: site.type || null,
    title: business.title || "",
    locality: business.locality || business.storefrontAddress?.locality || "",
    phone,
    phoneStatus: phoneStatus(phone),
    email: business.email || "",
    websiteUri: business.websiteUri || "",
    updatedAt: site.updatedAt,
    createdAt: site.createdAt,
  };
}

// -----------------------------
// LIST SITES (GET)
// ?search=<slug|title|phone>  ?issue=phone  (only rows needing a country-code fix)
// -----------------------------
export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const issue = searchParams.get("issue") || "";

    const query = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ slug: rx }, { userId: rx }, { "business.title": rx }];
    }

    const sites = await Site.find(query).sort({ updatedAt: -1 }).limit(300).lean();
    let rows = sites.map(serialize);

    if (issue === "phone") {
      rows = rows.filter((r) => r.phoneStatus !== "ok");
    }

    const counts = rows.reduce(
      (acc, r) => {
        acc[r.phoneStatus] = (acc[r.phoneStatus] || 0) + 1;
        return acc;
      },
      { ok: 0, no_country_code: 0, invalid: 0, missing: 0 }
    );

    return NextResponse.json({ success: true, data: rows, counts });
  } catch (err) {
    console.error("ADMIN WEBSITE BUILDER LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// UPDATE ONE SITE'S BASIC DETAILS (PUT)
// -----------------------------
export async function PUT(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await req.json();
    const { id, title, phone, email, websiteUri, locality, isPublished } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }

    const site = await Site.findById(id);
    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found." }, { status: 404 });
    }

    const business = { ...(site.business || {}) };

    if (typeof title === "string" && title.trim()) business.title = title.trim();
    if (typeof email === "string") business.email = email.trim();
    if (typeof websiteUri === "string") business.websiteUri = websiteUri.trim();
    if (typeof locality === "string" && locality.trim()) business.locality = locality.trim();

    if (typeof phone === "string") {
      const clean = normalizedPhone(phone);
      if (phone.trim() && !clean) {
        return NextResponse.json(
          { success: false, error: "That phone number is too short to be valid." },
          { status: 400 }
        );
      }
      // Both keys are kept in sync — different parts of the site read different ones.
      business.primaryPhone = clean;
      business.phoneNumbers = { ...(business.phoneNumbers || {}), primaryPhone: clean };
    }

    site.business = business;
    site.markModified("business"); // Object field — Mongoose needs this to persist
    if (typeof isPublished === "boolean") site.isPublished = isPublished;
    site.updatedAt = new Date();
    await site.save();

    return NextResponse.json({ success: true, data: serialize(site) });
  } catch (err) {
    console.error("ADMIN WEBSITE BUILDER UPDATE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// BULK: ADD THE MISSING COUNTRY CODE (POST)
// Only touches rows whose stored number is a local one — "invalid" and "missing"
// rows are left alone because there is nothing safe to infer for them.
// -----------------------------
export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    if (body.action !== "normalize-phones") {
      return NextResponse.json(
        { success: false, error: "Unknown action." },
        { status: 400 }
      );
    }

    const ids = Array.isArray(body.ids) ? body.ids : null;
    const query = ids && ids.length ? { _id: { $in: ids } } : {};
    const sites = await Site.find(query);

    let updated = 0;
    const changes = [];

    for (const site of sites) {
      const before = readPhone(site.business);
      if (phoneStatus(before) !== "no_country_code") continue;

      const after = normalizedPhone(before);
      if (!after) continue;

      const business = { ...(site.business || {}) };
      business.primaryPhone = after;
      business.phoneNumbers = { ...(business.phoneNumbers || {}), primaryPhone: after };

      site.business = business;
      site.markModified("business");
      site.updatedAt = new Date();
      await site.save();

      updated += 1;
      changes.push({ slug: site.slug, before, after });
    }

    return NextResponse.json({ success: true, updated, changes });
  } catch (err) {
    console.error("ADMIN WEBSITE BUILDER BULK FIX ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
