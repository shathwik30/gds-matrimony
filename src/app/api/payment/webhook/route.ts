import { NextRequest, NextResponse } from "next/server";
import { db, payments, subscriptions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  verifyRazorpaySignature,
  activateSubscription,
  activateContactPack,
} from "@/lib/payment-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!verifyRazorpaySignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Reject stale webhooks (older than 5 minutes based on header timestamp)
    const webhookTimestamp = req.headers.get("x-razorpay-event-timestamp");
    if (webhookTimestamp) {
      const eventAge = Date.now() - parseInt(webhookTimestamp, 10) * 1000;
      if (eventAge > 5 * 60 * 1000) {
        return NextResponse.json({ received: true, warning: "Stale webhook event" });
      }
    }

    let event: { event: string; payload: Record<string, unknown> };
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { event: eventType, payload } = event;

    switch (eventType) {
      case "payment.captured": {
        const payment = (payload as Record<string, unknown>)?.payment as
          | Record<string, unknown>
          | undefined;
        const entity = payment?.entity as Record<string, unknown> | undefined;
        if (!entity?.order_id || !entity?.id) {
          console.error("Webhook: payment.captured missing order_id or id");
          return NextResponse.json({ received: true, warning: "Invalid payment payload" });
        }
        const orderId = entity.order_id as string;
        const razorpayPaymentId = entity.id as string;

        const existingPayment = await db.query.payments.findFirst({
          where: eq(payments.razorpayPaymentId, razorpayPaymentId),
        });
        if (existingPayment) {
          return NextResponse.json({ received: true, note: "Already processed" });
        }

        const paymentRecord = await db.query.payments.findFirst({
          where: eq(payments.razorpayOrderId, orderId),
        });

        if (paymentRecord && paymentRecord.status === "created") {
          await db.transaction(async (tx) => {
            // Optimistic locking to prevent double processing
            const [updated] = await tx
              .update(payments)
              .set({
                status: "completed",
                razorpayPaymentId,
                updatedAt: new Date(),
              })
              .where(and(eq(payments.id, paymentRecord.id), eq(payments.status, "created")))
              .returning({ id: payments.id });

            if (!updated) return;

            if (
              paymentRecord.purchaseType?.startsWith("contact_pack_") &&
              paymentRecord.contactPackSize
            ) {
              await activateContactPack(
                tx,
                paymentRecord.userId,
                paymentRecord.id,
                paymentRecord.contactPackSize
              );
            } else if (paymentRecord.subscriptionId) {
              await tx
                .update(subscriptions)
                .set({ isActive: true })
                .where(eq(subscriptions.id, paymentRecord.subscriptionId));
            } else if (paymentRecord.plan) {
              await activateSubscription(
                tx,
                paymentRecord.userId,
                paymentRecord.plan,
                paymentRecord.id
              );
            }
          });
        }
        break;
      }

      case "payment.failed": {
        const failedPayment = (payload as Record<string, unknown>)?.payment as
          | Record<string, unknown>
          | undefined;
        const failedEntity = failedPayment?.entity as Record<string, unknown> | undefined;
        if (!failedEntity?.order_id) {
          console.error("Webhook: payment.failed missing order_id");
          return NextResponse.json({ received: true, warning: "Invalid failed payment payload" });
        }
        const orderId = failedEntity.order_id as string;

        // Prevent status regression: don't overwrite completed/refunded
        const paymentRecord = await db.query.payments.findFirst({
          where: eq(payments.razorpayOrderId, orderId),
        });

        if (
          paymentRecord &&
          paymentRecord.status !== "completed" &&
          paymentRecord.status !== "refunded"
        ) {
          await db
            .update(payments)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(payments.id, paymentRecord.id));
        }
        break;
      }

      case "refund.created": {
        const refund = (payload as Record<string, unknown>)?.refund as
          | Record<string, unknown>
          | undefined;
        const refundEntity = refund?.entity as Record<string, unknown> | undefined;
        if (!refundEntity?.payment_id || typeof refundEntity.payment_id !== "string") {
          console.error("Webhook: refund.created missing payment_id");
          return NextResponse.json({ received: true, warning: "Invalid refund payload" });
        }
        const paymentId = refundEntity.payment_id;

        const paymentRecord = await db.query.payments.findFirst({
          where: eq(payments.razorpayPaymentId, paymentId),
        });

        if (paymentRecord) {
          await db
            .update(payments)
            .set({ status: "refunded", updatedAt: new Date() })
            .where(eq(payments.id, paymentRecord.id));

          if (paymentRecord.subscriptionId) {
            await db
              .update(subscriptions)
              .set({ isActive: false })
              .where(eq(subscriptions.id, paymentRecord.subscriptionId));
          }
        }
        break;
      }

      default:
        console.warn(`Webhook: unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
