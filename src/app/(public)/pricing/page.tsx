import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, Sparkles, Star, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS, GST_RATE } from "@/constants";
import { formatCurrency, pluralize } from "@/lib/utils";
import { FAQJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Membership Plans & Pricing",
  description:
    "GDS Marriage Links membership plans starting from INR 2,557/month. Choose Basic, Silver, Gold, or Platinum for verified profiles, unlimited connections, direct messaging, and priority support.",
  keywords: [
    "matrimony membership plans",
    "matrimonial pricing India",
    "premium matrimony subscription",
    "GDS Marriage Links pricing",
    "affordable matrimony plans",
    "matrimonial service cost",
  ],
  alternates: {
    canonical: "/pricing",
  },
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: <Star className="h-6 w-6" />,
  silver: <Sparkles className="h-6 w-6" />,
  gold: <Crown className="h-6 w-6" />,
  platinum: <Zap className="h-6 w-6" />,
};

const pricingFAQs = [
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes, you can upgrade to a higher plan at any time. However, downgrades are not supported during an active subscription period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment partner Razorpay.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Absolutely! We use industry-standard encryption and never store your card details. All payments are processed through Razorpay's secure gateway.",
  },
  {
    question: "What happens after my subscription expires?",
    answer:
      "Your account will automatically revert to the Free plan. You'll retain access to your profile and basic features, but premium features will be locked.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <FAQJsonLd questions={pricingFAQs} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Pricing", href: "/pricing" },
        ]}
      />
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-28">
        <div className="container-wide text-center px-4 sm:px-6 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 sm:px-5 py-2 text-sm mb-4 sm:mb-6 shadow-premium-sm">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">Choose Your Perfect Plan</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
            Find Your Life Partner with{" "}
            <span className="text-brand">Premium Membership</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Unlock unlimited connections, verified profiles, and exclusive features to
            accelerate your journey to finding true love.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-12 sm:pb-16 md:pb-20">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.id === "gold";
              const totalAmount = Math.round(plan.price * (1 + GST_RATE));

              return (
                <Card
                  key={plan.id}
                  variant={isPopular ? "elevated" : "default"}
                  className={`relative ${
                    isPopular ? "border-2 border-primary scale-100 md:scale-105 shadow-premium-xl" : ""
                  } animate-fade-in-up`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-brand shadow-premium-md">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div
                      className={`mx-auto mb-4 p-4 rounded-full ${
                        plan.id === "basic"
                          ? "bg-blue-100 text-blue-600"
                          : plan.id === "silver"
                          ? "bg-gray-200 text-gray-600"
                          : plan.id === "gold"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-purple-100 text-purple-600"
                      } shadow-premium-sm`}
                    >
                      {PLAN_ICONS[plan.id]}
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-3 space-y-1">
                      <span className="text-3xl sm:text-4xl font-bold text-foreground block">
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

                  <CardContent className="space-y-3 px-6">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>
                          <strong>
                            {plan.features.interestsPerDay === 9999 || plan.features.interestsPerDay === -1
                              ? "Unlimited"
                              : plan.features.interestsPerDay}
                          </strong>{" "}
                          interests per day
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>
                          <strong>
                            {plan.features.contactViews === 9999 || plan.features.contactViews === -1
                              ? "Unlimited"
                              : plan.features.contactViews}
                          </strong>{" "}
                          contact views
                        </span>
                      </li>
                      {plan.features.chat && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>
                            {plan.features.chat === "mutual_only" ? "Chat (mutual interest)" : "Direct messaging"}
                          </span>
                        </li>
                      )}
                      {plan.features.profileBoosts > 0 && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>
                            <strong>{plan.features.profileBoosts}</strong> {pluralize("profile boost", plan.features.profileBoosts)}
                          </span>
                        </li>
                      )}
                      {plan.features.seeProfileViewers && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>See who viewed you</span>
                        </li>
                      )}
                      {plan.features.seeWhoLiked && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>See who liked you</span>
                        </li>
                      )}
                      {(plan.features.support === "priority" ||
                        plan.features.support === "premium") && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>{plan.features.support === "premium" ? "Premium" : "Priority"} support</span>
                        </li>
                      )}
                      {plan.features.featuredBadge && (
                        <li className="flex items-center gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>Featured profile badge</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className={`w-full ${
                        isPopular ? "shadow-premium-lg hover:shadow-premium-xl" : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/register">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-card">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
              Why Choose Premium?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Upgrade to unlock powerful features that help you find your perfect match faster.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto">
            <Card variant="elevated" className="text-center group">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-premium-md">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Unlimited Connections</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send unlimited interests and connect with more profiles daily to increase
                  your chances of finding the perfect match.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center group">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-premium-md">
                  <Check className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Verified Badge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stand out with a verified badge that shows you&apos;re genuine and serious
                  about finding your life partner.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center group">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-premium-md">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Priority Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get dedicated support from our team to help you navigate and make the most
                  of your matchmaking journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Can I upgrade or downgrade my plan?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade to a higher plan at any time. However, downgrades are
                  not supported during an active subscription period.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit/debit cards, UPI, net banking, and digital
                  wallets through our secure payment partner Razorpay.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Is my payment information secure?</h3>
                <p className="text-muted-foreground">
                  Absolutely! We use industry-standard encryption and never store your card
                  details. All payments are processed through Razorpay&apos;s secure gateway.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">What happens after my subscription expires?</h3>
                <p className="text-muted-foreground">
                  Your account will automatically revert to the Free plan. You&apos;ll retain
                  access to your profile and basic features, but premium features will be locked.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container-wide text-center relative z-10 px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-base sm:text-lg md:text-xl opacity-95 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed">
            Join thousands of verified members and start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              variant="secondary"
              asChild
              className="shadow-premium-xl hover:shadow-premium-2xl group bg-white text-primary hover:bg-white/95"
            >
              <Link href="/register">
                Register Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              asChild
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-smooth backdrop-blur-sm"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
