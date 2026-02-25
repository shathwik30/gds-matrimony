import crypto from "crypto";
import { db, payments, subscriptions, contactPackPurchases } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUBSCRIPTION_PLANS } from "@/constants";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

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

  await tx
    .update(subscriptions)
    .set({ isActive: false })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)));

  const [newSub] = await tx
    .insert(subscriptions)
    .values({
      userId,
      plan: planId as SubscriptionPlanId,
      startDate,
      endDate,
      isActive: true,
      interestsPerDay: plan.features.interestsPerDay,
      contactViews: plan.features.contactViews,
      profileBoosts: plan.features.profileBoosts,
    })
    .returning({ id: subscriptions.id });

  await tx.update(payments).set({ subscriptionId: newSub.id }).where(eq(payments.id, paymentId));

  return { subscriptionId: newSub.id };
}

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
