import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { findUser } from "@/lib/homeSections/user";
import { buildUserContext } from "@/lib/homeSections/access";
import { ok, fail, seedIfEmpty, toPublicSection } from "@/lib/homeSections/server";
import { getCoinBasedRates, getFeatureAccessPrice } from "@/lib/featureAccess";

export const dynamic = "force-dynamic";

/**
 * PUBLIC — GET /api/home-sections?userId=USR123&phone=9891234890
 *
 * Mobile app home screen tiles, per user. Both query params are optional:
 * userId is tried first, then phone. Unknown or missing user → guest view.
 */
export async function GET(req) {
  try {
    await dbConnect();
    await seedIfEmpty();

    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get("userId") || "").trim();
    const phone = (searchParams.get("phone") || "").trim();

    const [docs, user, featureAccessPrice, coinRates] = await Promise.all([
      HomeSection.find({ isActive: true }).sort({ order: 1 }).lean(),
      userId || phone ? findUser({ userId, phone }) : Promise.resolve(null),
      getFeatureAccessPrice(),
      getCoinBasedRates(),
    ]);

    const ctx = buildUserContext(user, { featureAccessPrice, coinRates });
    const sections = docs
      .map((doc) => toPublicSection(doc, ctx))
      .filter((s) => s.items.length > 0);

    const lastUpdated = docs.reduce(
      (max, d) => (d.updatedAt > max ? d.updatedAt : max),
      new Date(0)
    );

    return ok(
      {
        version: Math.floor(lastUpdated.getTime() / 1000),
        updatedAt: lastUpdated.toISOString(),
        user: {
          found: Boolean(user),
          userId: user ? user.userId : null,
          // A plan can live in either field; report whichever one is real so
          // the app never shows "Free" to someone who has paid.
          plan:
            (user?.subscription?.plan || "").trim() ||
            (user?.paidPackage || "").trim() ||
            "Free",
          isPaid: ctx.isPaid,
          wallet: ctx.wallet,
        },
        // Coins charged per open for pay_per_use tiles, so the app can show the
        // price without reading every tile.
        featureAccessPrice,
        sections,
      },
      "Home sections fetched successfully",
      200,
      // Response depends on the user, so only the user's own device may cache it.
      { "Cache-Control": "private, max-age=60" }
    );
  } catch (err) {
    console.error("GET /api/home-sections error:", err);
    return fail(500, "Unable to fetch home sections");
  }
}
