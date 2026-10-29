import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import HomeSection from "@/models/HomeSection";
import { validateSection } from "./validation";
import { isVisible, resolveItemAccess } from "./access";
import seed from "./seed.json";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

export const ok = (data, message = "Success", status = 200, headers) =>
  NextResponse.json({ success: true, message, data }, { status, headers });

export const fail = (status, message, errors) =>
  NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });

/** Same Bearer-JWT auth as the other admin routes. Returns a response on failure, else null. */
export function requireAdmin(req) {
  const auth = req.headers.get("authorization");
  if (!auth) return fail(401, "Unauthorized");
  try {
    jwt.verify(auth.split(" ")[1], JWT_SECRET);
    return null;
  } catch {
    return fail(401, "Invalid token");
  }
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Loads the starting sections from seed.json the first time the collection is
 * empty, so a fresh deploy serves the current app tiles without a seed script.
 */
export async function seedIfEmpty() {
  if (await HomeSection.estimatedDocumentCount()) return;
  for (const section of seed.sections) {
    if (validateSection(section).length) continue;
    await HomeSection.updateOne(
      { key: section.key },
      {
        $setOnInsert: {
          ...section,
          isActive: true,
          items: section.items.map((item) => ({ ...item, isActive: true })),
        },
      },
      { upsert: true }
    );
  }
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/**
 * Length-based price with every allowed length and its total, so the app can
 * render the duration picker without doing the maths itself.
 */
function toPublicPricing(pricing) {
  if (!pricing || !(Number(pricing.coinsPerSecond) > 0)) return null;
  const coinsPerSecond = Number(pricing.coinsPerSecond);
  const minSeconds = Number(pricing.minSeconds) || 10;
  const maxSeconds = Number(pricing.maxSeconds) || 60;
  const stepSeconds = Number(pricing.stepSeconds) || 10;
  const options = [];
  for (let seconds = minSeconds; seconds <= maxSeconds; seconds += stepSeconds) {
    options.push({ seconds, coins: seconds * coinsPerSecond });
  }
  return { coinsPerSecond, minSeconds, maxSeconds, stepSeconds, options };
}

/** Shape one DB section into the public API format, for this user. */
export function toPublicSection(doc, ctx) {
  return {
    key: doc.key,
    title: doc.title,
    subtitle: doc.subtitle || "",
    icon: doc.icon,
    viewAll: doc.viewAll || null,
    order: doc.order,
    items: (doc.items || [])
      .filter((item) => item.isActive !== false && isVisible(item, ctx))
      .sort(byOrder)
      .map((item) => {
        const { badge, access } = resolveItemAccess(item, ctx);
        return {
          key: item.key,
          label: item.label,
          icon: item.icon,
          badge,
          action: item.action,
          access,
          comingSoon: Boolean(item.comingSoon),
          coinCost: Number(item.coinCost) || 0,
          pricing: toPublicPricing(item.pricing),
          order: item.order,
        };
      }),
  };
}
