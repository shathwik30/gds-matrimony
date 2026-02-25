import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, payments } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUBSCRIPTION_PLANS, CONTACT_PACKS } from "@/constants";
import { parseUserId } from "@/lib/utils";
import {
  verifyRazorpaySignature,
  activateSubscription,
  activateContactPack,
} from "@/lib/payment-helpers";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!requestBody || typeof requestBody !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = requestBody as {
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
    };

    if (typeof razorpay_order_id !== "string" || !razorpay_order_id.trim()) {
      return NextResponse.json({ error: "razorpay_order_id is required" }, { status: 400 });
    }
    if (typeof razorpay_payment_id !== "string" || !razorpay_payment_id.trim()) {
      return NextResponse.json({ error: "razorpay_payment_id is required" }, { status: 400 });
    }
    if (typeof razorpay_signature !== "string" || !razorpay_signature.trim()) {
      return NextResponse.json({ error: "razorpay_signature is required" }, { status: 400 });
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpaySecret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
    }

    const payload = razorpay_order_id + "|" + razorpay_payment_id;
    if (!verifyRazorpaySignature(payload, razorpay_signature, razorpaySecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const userId = parseUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const paymentRecord = await db.query.payments.findFirst({
      where: and(eq(payments.razorpayOrderId, razorpay_order_id), eq(payments.userId, userId)),
    });

    if (!paymentRecord) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (paymentRecord.status === "completed") {
      if (paymentRecord.purchaseType?.startsWith("contact_pack_")) {
        const pack = CONTACT_PACKS.find((p) => p.id === paymentRecord.purchaseType);
        return NextResponse.json({
          success: true,
          message: "Payment already verified",
          item: pack?.name || "Contact Pack",
        });
      } else {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === paymentRecord.plan);
        return NextResponse.json({
          success: true,
          message: "Payment already verified",
          plan: plan?.name || paymentRecord.plan,
        });
      }
    }

    if (paymentRecord.status !== "created") {
      return NextResponse.json(
        { error: "Payment is not in a valid state for verification" },
        { status: 400 }
      );
    }

    if (paymentRecord.purchaseType?.startsWith("contact_pack_")) {
      const packSize = paymentRecord.contactPackSize;
      if (!packSize) {
        return NextResponse.json({ error: "Invalid contact pack data" }, { status: 400 });
      }

      const packResult = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(payments)
          .set({
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(and(eq(payments.id, paymentRecord.id), eq(payments.status, "created")))
          .returning({ id: payments.id });

        if (!updated) return null;

        await activateContactPack(tx, userId, paymentRecord.id, packSize);
        return updated;
      });

      if (!packResult) {
        return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
      }

      const pack = CONTACT_PACKS.find((p) => p.id === paymentRecord.purchaseType);
      return NextResponse.json({
        success: true,
        message: "Payment verified and contact pack activated",
        item: pack?.name || "Contact Pack",
        contacts: packSize,
      });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === paymentRecord.plan);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(payments)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentRecord.id), eq(payments.status, "created")))
        .returning({ id: payments.id });

      if (!updated) return null;

      return activateSubscription(tx, userId, paymentRecord.plan, paymentRecord.id);
    });

    if (!result) {
      return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      plan: plan.name,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
