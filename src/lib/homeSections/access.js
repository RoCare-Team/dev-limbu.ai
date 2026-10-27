import { ACCESS_STATUS } from "./constants";
import { getActivePlans, getFreeUsed } from "./user";

/**
 * Builds the per-request user context once.
 * `user` is null for guests or when the user is not found.
 */
export function buildUserContext(user) {
  const activePlans = getActivePlans(user);
  return {
    user,
    activePlans,
    isPaid: activePlans.length > 0,
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
 *   1. user's plan includes the tile     -> active  + "ACTIVE"
 *   2. tile is free for everyone          -> free    + "FREE"
 *   3. tile has free uses left            -> free    + "FREE"  (+ freeRemaining)
 *   4. free uses finished / needs a plan  -> locked  + "UPGRADE"
 *   5. no plan rules on the tile          -> open    + admin badge (e.g. "NEW")
 *
 * item.comingSoon overrides all of the above -> coming_soon + "COMING SOON".
 * item.coinCost > 0 (and no plan includes it)  -> coins       + "COINS".
 */
export function resolveItemAccess(item, ctx) {
  if (item.comingSoon) {
    return {
      badge: "COMING SOON",
      access: { status: ACCESS_STATUS.COMING_SOON, planName: null, freeRemaining: null },
    };
  }

  const access = item.access || {};
  const included = (access.includedInPlans || []).map((p) =>
    String(p).trim().toLowerCase()
  );
  const freeLimit = Number(access.freeLimit) || 0;

  const matchedPlan = included.find((p) => ctx.activePlans.includes(p));
  if (matchedPlan) {
    const planName =
      (ctx.user && ctx.user.subscription && ctx.user.subscription.plan) ||
      matchedPlan;
    return {
      badge: "ACTIVE",
      access: { status: ACCESS_STATUS.ACTIVE, planName, freeRemaining: null },
    };
  }

  if (Number(item.coinCost) > 0) {
    return {
      badge: "COINS",
      access: { status: ACCESS_STATUS.COINS, planName: null, freeRemaining: null },
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

