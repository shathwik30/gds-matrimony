"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Crown, Sparkles, Star, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SUBSCRIPTION_PLANS, GST_RATE } from "@/constants";
import { getMySubscription, activateProfileBoost, getBoostStatus } from "@/lib/actions/subscription";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useSession } from "next-auth/react";

import { loadRazorpayScript, verifyRazorpayPayment, type RazorpayOptions } from "@/lib/razorpay";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: <Star className="h-6 w-6" />,
  silver: <Sparkles className="h-6 w-6" />,
  gold: <Crown className="h-6 w-6" />,
  platinum: <Zap className="h-6 w-6" />,
};

export default function MembershipPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [boostStatus, setBoostStatus] = useState<{ isActive: boolean; expiresAt?: Date; remaining: number } | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);

  useEffect(() => {
    loadSubscription();
    loadBoostStatus();
    loadRazorpayScript();
  }, []);

  const loadSubscription = async () => {
    try {
      const result = await getMySubscription();
      if (result.success && result.data) {
        setCurrentPlan(result.data.plan);
        setSubscriptionEnd(result.data.endDate);
        // Check if subscription is active and not expired
        const isActive = result.data.plan && result.data.plan !== "free" &&
          (!result.data.endDate || new Date(result.data.endDate) > new Date());
        setHasActiveSubscription(!!isActive);
      } else {
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error("Failed to load subscription:", error);
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBoostStatus = async () => {
    try {
      const result = await getBoostStatus();
      if (result.success && result.data) {
        setBoostStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to load boost status:", error);
    }
  };

  const handleActivateBoost = async () => {
    setActivatingBoost(true);
    try {
      const result = await activateProfileBoost();
      if (result.success) {
        toast.success(result.message || "Profile boosted for 24 hours!");
        await loadBoostStatus(); // Refresh boost status
      } else {
        toast.error(result.error || "Failed to activate boost");
      }
    } catch {
      toast.error("Failed to activate boost");
    } finally {
      setActivatingBoost(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return;

    // Check Razorpay script is loaded BEFORE creating the order
    if (typeof window.Razorpay !== "function") {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setProcessingPlan(planId);

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

      // Open Razorpay checkout — use keyId from server to guarantee key/order match
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GDS Marriage Links",
        description: `${plan?.name || planId} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyData = await verifyRazorpayPayment(response);
            if (verifyData.success) {
              toast.success("Payment successful! Your subscription is now active.");
              router.refresh();
              loadSubscription();
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
          } catch {
            toast.error("Failed to verify payment");
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#C00F0C",
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed. Please try again.");
        setProcessingPlan(null);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upgrade your membership to unlock premium features and connect with more potential matches.
        </p>
        {currentPlan && currentPlan !== "free" && subscriptionEnd && (
          <div className="mt-4 space-y-2">
            <Badge variant="secondary" className="text-sm">
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} (expires{" "}
              {new Date(subscriptionEnd).toLocaleDateString()})
            </Badge>
            {hasActiveSubscription && (
              <p className="text-sm text-muted-foreground">
                You can subscribe to a new plan after your current subscription expires
              </p>
            )}
          </div>
        )}
      </div>

      {/* Profile Boost Card */}
      {currentPlan && currentPlan !== "free" && (
        <Card className="mb-8 max-w-3xl mx-auto border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <CardTitle>Profile Boost</CardTitle>
                <CardDescription>Get 15% higher visibility for 24 hours</CardDescription>
              </div>
              {boostStatus && boostStatus.remaining > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {boostStatus.remaining === 9999 || boostStatus.remaining === -1 ? "Unlimited" : `${boostStatus.remaining} remaining`}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {boostStatus?.isActive ? (
              <Alert className="border-purple-200 bg-purple-50">
                <Zap className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-900">Boost Active</AlertTitle>
                <AlertDescription className="text-purple-700">
                  Your profile is boosted! Expires {boostStatus.expiresAt ? formatRelativeTime(boostStatus.expiresAt) : "soon"}
                </AlertDescription>
              </Alert>
            ) : boostStatus && boostStatus.remaining > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Activate a boost to increase your profile visibility by 15% in search results for 24 hours. Perfect for when you want to stand out!
                </p>
                <Button
                  onClick={handleActivateBoost}
                  disabled={activatingBoost}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {activatingBoost ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Activate Boost
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Boosts Available</AlertTitle>
                <AlertDescription>
                  Upgrade to Gold or Platinum to get profile boosts included with your plan.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isPopular = plan.id === "gold";
          const isDisabled = hasActiveSubscription && !isCurrentPlan;
          const gstAmount = Math.round(plan.price * GST_RATE);
          const totalAmount = plan.price + gstAmount;

          return (
            <Card
              key={plan.id}
              variant={isPopular ? "elevated" : "default"}
              className={`relative animate-fade-in-up ${
                isPopular ? "border-2 border-brand shadow-premium-xl scale-105" : ""
              } ${isCurrentPlan ? "border-2 border-green-500" : ""} ${
                isDisabled ? "opacity-50" : ""
              }`}
            >
              {(isPopular || isCurrentPlan) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={isCurrentPlan ? "bg-green-500" : "bg-brand"}>
                    {isCurrentPlan ? "Current Plan" : "Most Popular"}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto mb-2 p-3 rounded-full ${
                  plan.id === "basic"
                    ? "bg-blue-100 text-blue-600"
                    : plan.id === "silver"
                    ? "bg-gray-200 text-gray-600"
                    : plan.id === "gold"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-purple-100 text-purple-600"
                }`}>
                  {PLAN_ICONS[plan.id]}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="text-3xl font-bold text-foreground block">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-sm block">
                    /{plan.duration === 1 ? "month" : `${plan.duration} months`}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {formatCurrency(totalAmount)} after GST
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>
                      {plan.features.interestsPerDay === 9999 || plan.features.interestsPerDay === -1
                        ? "Unlimited"
                        : plan.features.interestsPerDay}{" "}
                      interests/day
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>
                      {plan.features.contactViews === 9999 || plan.features.contactViews === -1
                        ? "Unlimited"
                        : plan.features.contactViews}{" "}
                      contact views
                    </span>
                  </li>
                  {plan.features.chat && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>
                        {plan.features.chat === "mutual_only" ? "Chat (mutual interest)" : "Direct messaging"}
                      </span>
                    </li>
                  )}
                  {plan.features.profileBoosts > 0 && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plan.features.profileBoosts} profile boost{plan.features.profileBoosts > 1 ? "s" : ""}</span>
                    </li>
                  )}
                  {plan.features.seeProfileViewers && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>See who viewed you</span>
                    </li>
                  )}
                  {plan.features.seeWhoLiked && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>See who liked you</span>
                    </li>
                  )}
                  {(plan.features.support === "priority" || plan.features.support === "premium") && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plan.features.support === "premium" ? "Premium" : "Priority"} support</span>
                    </li>
                  )}
                  {plan.features.featuredBadge && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Featured badge</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                {hasActiveSubscription && !isCurrentPlan ? (
                  <div className="w-full text-center">
                    <p className="text-sm text-muted-foreground">
                      Available after current plan expires
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan || processingPlan !== null || (hasActiveSubscription && !isCurrentPlan)}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {processingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Why Upgrade?</h2>
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="p-4">
            <Crown className="h-8 w-8 mx-auto text-brand mb-2" />
            <h3 className="font-medium">More Connections</h3>
            <p className="text-sm text-muted-foreground">
              Send more interests and connect with more profiles daily.
            </p>
          </div>
          <div className="p-4">
            <Check className="h-8 w-8 mx-auto text-brand mb-2" />
            <h3 className="font-medium">Verified Badge</h3>
            <p className="text-sm text-muted-foreground">
              Stand out with a verified badge that shows you&apos;re genuine.
            </p>
          </div>
          <div className="p-4">
            <Zap className="h-8 w-8 mx-auto text-brand mb-2" />
            <h3 className="font-medium">Priority Support</h3>
            <p className="text-sm text-muted-foreground">
              Get dedicated support to help you find your perfect match.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
