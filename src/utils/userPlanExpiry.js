/**
 * The effective plan expiry for a user.
 *
 * Users can carry TWO expiry sources that drift out of sync:
 *   - `packageExpiryDate` (denormalized field, updated by some flows)
 *   - `subscription.expiry` (the live purchase/renewal record shown on /profile)
 *
 * A renewal that updated only `subscription.expiry` left `packageExpiryDate`
 * stale, so the automation crons (which read packageExpiryDate) wrongly treated
 * an active user as expired and deactivated the plan. Use the LATEST of the two
 * so a valid subscription is never wrongly expired.
 */
export function getEffectivePackageExpiry(user) {
  if (!user) return null;
  const times = [];

  if (user.packageExpiryDate) {
    const d = new Date(user.packageExpiryDate);
    if (!Number.isNaN(d.getTime())) times.push(d.getTime());
  }

  const sub = user.subscription;
  // Only trust the subscription record when it isn't explicitly cancelled/expired.
  if (sub && sub.expiry && (!sub.status || sub.status === 'active')) {
    const d = new Date(sub.expiry);
    if (!Number.isNaN(d.getTime())) times.push(d.getTime());
  }

  if (!times.length) return null;
  return new Date(Math.max(...times));
}

/** True when the user's plan is still valid right now (latest expiry in the future). */
export function isPlanCurrentlyValid(user, now = new Date()) {
  const exp = getEffectivePackageExpiry(user);
  return !!(exp && exp.getTime() > now.getTime());
}
