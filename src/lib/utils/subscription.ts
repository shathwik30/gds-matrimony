/**
 * Pure subscription utility functions (no server context required).
 * Kept outside "use server" files so they can be synchronous.
 */

/**
 * Check if a subscription limit value represents "unlimited".
 * Convention: -1 or 9999 both mean unlimited.
 */
export function isUnlimited(limit: number | null | undefined): boolean {
  return limit === -1 || limit === 9999;
}

/**
 * Check if the user is on a free plan or has no active subscription.
 */
export function isFreeUser(subscription: { plan: string | null } | null): boolean {
  return !subscription || subscription.plan === "free";
}
