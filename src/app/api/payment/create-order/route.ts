import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { db, payments, users, subscriptions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUBSCRIPTION_PLANS, CONTACT_PACKS, GST_RATE } from "@/constants";
import { parseUserId } from "@/lib/utils";

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate planId or purchaseType
    if (!body || typeof body !== "object" || (!("planId" in body) && !("purchaseType" in body))) {
      return NextResponse.json({ error: "planId or purchaseType is required" }, { status: 400 });
    }

    const { planId, purchaseType } = body as { planId?: unknown; purchaseType?: unknown };

    let amount = 0;
    let itemType: "subscription" | "contact_pack" = "subscription";
    let contactPackSize: number | undefined;
    let planValue: "free" | "basic" | "silver" | "gold" | "platinum" | null = null;

    // Handle contact pack purchases
    if (purchaseType && typeof purchaseType === "string" && purchaseType.startsWith("contact_pack_")) {
      const pack = CONTACT_PACKS.find(p => p.id === purchaseType);
      if (!pack) {
        return NextResponse.json({ error: "Invalid contact pack" }, { status: 400 });
      }
      amount = Math.round(pack.price * (1 + GST_RATE));
      itemType = "contact_pack";
      contactPackSize = pack.size;
    }
    // Handle subscription plans
    else if (planId && typeof planId === "string" && planId.trim()) {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan || plan.price === 0) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      amount = Math.round(plan.price * (1 + GST_RATE));
      planValue = plan.id as "free" | "basic" | "silver" | "gold" | "platinum";
    } else {
      return NextResponse.json({ error: "Invalid planId or purchaseType" }, { status: 400 });
    }

    // Get user
    const userId = parseUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan hierarchy only for subscription purchases
    if (itemType === "subscription" && planValue) {
      const existingSub = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.isActive, true),
        ),
      });

      if (existingSub && existingSub.plan !== "free") {
        // Determine plan hierarchy to prevent same-plan or downgrade purchases
        const planHierarchy = ["free", "basic", "silver", "gold", "platinum"];
        const currentPlanIndex = planHierarchy.indexOf(existingSub.plan || "free");
        const newPlanIndex = planHierarchy.indexOf(planValue);

        if (newPlanIndex <= currentPlanIndex) {
          return NextResponse.json(
            { error: `You already have an active ${existingSub.plan} subscription. You can only upgrade to a higher plan.` },
            { status: 400 }
          );
        }
      }
    }

    // Create Razorpay order
    const notes: Record<string, string> = {
      userId: String(user.id),
      itemType,
      userEmail: user.email,
    };

    if (planValue) {
      notes.planId = planValue;
    }

    if (purchaseType) {
      notes.purchaseType = String(purchaseType);
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}_${user.id}_${Math.random().toString(36).slice(2, 10)}`,
      notes,
    });

    // Save payment record - match exact schema types
    const basePaymentData = {
      userId: user.id,
      razorpayOrderId: order.id,
      amount: amount.toString(),
      currency: "INR" as const,
      status: "created" as const,
    };

    let fullPaymentData;
    if (itemType === "subscription" && planValue) {
      fullPaymentData = {
        ...basePaymentData,
        plan: planValue as "free" | "basic" | "silver" | "gold" | "platinum",
        purchaseType: "subscription" as const,
      };
    } else if (itemType === "contact_pack" && contactPackSize) {
      fullPaymentData = {
        ...basePaymentData,
        purchaseType: purchaseType as "contact_pack_10" | "contact_pack_25" | "contact_pack_50",
        contactPackSize,
      };
    } else {
      fullPaymentData = basePaymentData;
    }

    await db.insert(payments).values(fullPaymentData);

    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!publicKeyId) {
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
