import crypto from "crypto";
import { db, payments, subscriptions, contactPackPurchases } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUBSCRIPTION_PLANS } from "@/constants";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Verify a Razorpay HMAC-SHA256 signature using constant-time comparison.
 */
export function verifyRazorpaySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Both hex strings are same length (SHA-256 = 64 hex chars), safe for timingSafeEqual
  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Safe month addition that handles overflow (e.g., Jan 31 + 1 month = Feb 28).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0); // last day of previous month
  }
  return result;
}

/**
 * Activate a subscription within a transaction. Deactivates existing subs,
 * creates the new one, and links it to the payment.
 * Returns the new subscription id, or null if the plan is not found.
 */
type SubscriptionPlanId = "free" | "basic" | "silver" | "gold" | "platinum";

export async function activateSubscription(
  tx: Tx,
  userId: number,
  planId: SubscriptionPlanId | string | null,
  paymentId: number
): Promise<{ subscriptionId: number } | null> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) return null;

  const startDate = new Date();
  const endDate = addMonths(startDate, plan.duration);

  // Deactivate existing subscriptions
  await tx
    .update(subscriptions)
    .set({ isActive: false })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)));

  // Create new subscription
  const [newSub] = await tx.insert(subscriptions).values({
    userId,
    plan: planId as SubscriptionPlanId,
    startDate,
    endDate,
    isActive: true,
    interestsPerDay: plan.features.interestsPerDay,
    contactViews: plan.features.contactViews,
    profileBoosts: plan.features.profileBoosts,
  }).returning({ id: subscriptions.id });

  // Link subscription to payment
  await tx
    .update(payments)
    .set({ subscriptionId: newSub.id })
    .where(eq(payments.id, paymentId));

  return { subscriptionId: newSub.id };
}

/**
 * Activate a contact pack purchase within a transaction.
 */
export async function activateContactPack(
  tx: Tx,
  userId: number,
  paymentId: number,
  packSize: number
): Promise<void> {
  await tx.insert(contactPackPurchases).values({
    userId,
    paymentId,
    packSize,
    contactsRemaining: packSize,
    purchasedAt: new Date(),
  });
}
