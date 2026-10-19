import { ACCESS_STATUS } from "./constants";
import { getActivePlans, getFreeUsed, normalizePlanName } from "./user";
import {
  COIN_BASED_TILES,
  DEFAULT_FEATURE_ACCESS_PRICE,
  FEATURE_KEYS,
} from "@/lib/featureAccess";

/**
 * Builds the per-request user context once.
 * `user` is null for guests or when the user is not found.
 */
export function buildUserContext(user, options = {}) {
  const activePlans = getActivePlans(user);
  const price = Number(options.featureAccessPrice);
  return {
    user,
    activePlans,
    isPaid: activePlans.length > 0,
    wallet: Number(user?.wallet) || 0,
    // Coin rates for the metered tools (AI video), resolved once per request.
    coinRates: options.coinRates || COIN_BASED_TILES,
    // Coins charged per open for the pay-per-use tiles (GBP tools).
    featureAccessPrice: Number.isFinite(price)
      ? price
      : DEFAULT_FEATURE_ACCESS_PRICE,
  };
}

/** Should this tile be shown to this user at all? */
export function isVisible(item, ctx) {
  const visibleTo = (item.access && item.access.visibleTo) || "all";
  if (visibleTo === "free_users") return !ctx.isPaid;
  if (visibleTo === "paid_users") return ctx.isPaid;
  return true;
}

/**
 * Decides what one tile looks like for this user.
 *
 *   0a. AI video tool                     -> coin_based  (coins per generation)
 *   0b. GBP / social tool, no plan        -> pay_per_use + "PAY" (coins per open)
 *   1. user's plan includes the tile     -> active  + "ACTIVE"
 *   2. tile is free for everyone          -> free    + "FREE"
 *   3. tile has free uses left            -> free    + "FREE"  (+ freeRemaining)
 *   4. free uses finished / needs a plan  -> locked  + "UPGRADE"
 *   5. no plan rules on the tile          -> open    + admin badge (e.g. "NEW")
 */
export function resolveItemAccess(item, ctx) {
  const access = item.access || {};
  const included = (access.includedInPlans || []).map(normalizePlanName);
  const freeLimit = Number(access.freeLimit) || 0;

  const matchedPlan = included.find((p) => ctx.activePlans.includes(p));

  /**
   * Tools that meter coins on the work itself (AI video generation). They are
   * never pay-per-open — the app just shows the rate up front.
   */
  const coinRate = (ctx.coinRates || COIN_BASED_TILES)[item.key];
  if (coinRate) {
    return {
      badge: item.badge || null,
      access: {
        status: ACCESS_STATUS.COIN_BASED,
        planName: matchedPlan || null,
        freeRemaining: null,
        coinBased: {
          coins: coinRate.coins,
          unit: coinRate.unit,
          currency: "coins",
          wallet: ctx.wallet || 0,
          canAfford: (ctx.wallet || 0) >= coinRate.coins,
        },
      },
    };
  }

  /**
   * GBP and social tools are plan-or-pay: a running plan covers them,
   * otherwise the user may open one by paying coins each time. This sits above
   * the free/locked rules below because it replaces them for these tiles.
   */
  if (!matchedPlan && FEATURE_KEYS.includes(item.key)) {
    const coins = ctx.featureAccessPrice;
    return {
      badge: "PAY",
      access: {
        status: ACCESS_STATUS.PAY_PER_USE,
        planName: null,
        freeRemaining: null,
        payPerUse: {
          coins,
          currency: "coins",
          canAfford: (ctx.wallet || 0) >= coins,
          wallet: ctx.wallet || 0,
          feature: item.key,
          chargeEndpoint: "/api/feature-access",
        },
      },
    };
  }

  if (matchedPlan) {
    const planName =
      (ctx.user && ctx.user.subscription && ctx.user.subscription.plan) ||
      matchedPlan;
    return {
      badge: "ACTIVE",
      access: { status: ACCESS_STATUS.ACTIVE, planName, freeRemaining: null },
    };
  }

  if (access.freeForAll) {
    return {
      badge: "FREE",
      access: { status: ACCESS_STATUS.FREE, planName: null, freeRemaining: null },
    };
  }

  if (freeLimit > 0) {
    const used = getFreeUsed(ctx.user, item.key);
    const remaining = Math.max(0, freeLimit - used);
    if (remaining > 0) {
      return {
        badge: "FREE",
        access: {
          status: ACCESS_STATUS.FREE,
          planName: null,
          freeRemaining: remaining,
        },
      };
    }
    return {
      badge: "UPGRADE",
      access: { status: ACCESS_STATUS.LOCKED, planName: null, freeRemaining: 0 },
    };
  }

  if (included.length > 0) {
    return {
      badge: "UPGRADE",
      access: { status: ACCESS_STATUS.LOCKED, planName: null, freeRemaining: null },
    };
  }

  return {
    badge: item.badge || null,
    access: { status: ACCESS_STATUS.OPEN, planName: null, freeRemaining: null },
  };
}

