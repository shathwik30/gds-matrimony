// -1 or 9999 both mean unlimited
export function isUnlimited(limit: number | null | undefined): boolean {
  return limit === -1 || limit === 9999;
}

export function isFreeUser(subscription: { plan: string | null } | null): boolean {
  return !subscription || subscription.plan === "free";
}
