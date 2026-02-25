import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Heart,
  MessageSquare,
  Users,
  ArrowRight,
  Settings,
  Crown,
  ImageIcon,
  Camera,
  FileText,
  Briefcase,
  User,
  Ruler,
  BookOpen,
  MapPin,
  GraduationCap,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getMyProfile, getRecommendedMatches } from "@/lib/actions/profile";
import { getDashboardStats } from "@/lib/actions/activity";
import { getMySubscription } from "@/lib/actions/subscription";
import { ProfileCard } from "@/components/matching/profile-card";
import { SUBSCRIPTION_PLANS } from "@/constants";
import { getMissingProfileFields } from "@/lib/utils";

const FIELD_META: Record<string, { icon: LucideIcon; label: string }> = {
  firstName: { icon: User, label: "Add your first name" },
  lastName: { icon: User, label: "Add your last name" },
  gender: { icon: User, label: "Select your gender" },
  dateOfBirth: { icon: User, label: "Add date of birth" },
  height: { icon: Ruler, label: "Add your height" },
  weight: { icon: Ruler, label: "Add your weight" },
  religion: { icon: BookOpen, label: "Select your religion" },
  caste: { icon: BookOpen, label: "Add your caste" },
  motherTongue: { icon: BookOpen, label: "Add mother tongue" },
  countryLivingIn: { icon: MapPin, label: "Add country of residence" },
  residingState: { icon: MapPin, label: "Add your state" },
  residingCity: { icon: MapPin, label: "Add your city" },
  highestEducation: { icon: GraduationCap, label: "Add your education" },
  occupation: { icon: Briefcase, label: "Add your occupation" },
  annualIncome: { icon: Wallet, label: "Add annual income" },
  maritalStatus: { icon: Heart, label: "Select marital status" },
  familyStatus: { icon: Users, label: "Add family status" },
  familyType: { icon: Users, label: "Add family type" },
  profileImage: { icon: Camera, label: "Add a profile photo" },
  aboutMe: { icon: FileText, label: "Write about yourself" },
};

async function DashboardStats() {
  const [profileResult, statsResult, subscriptionResult] = await Promise.all([
    getMyProfile(),
    getDashboardStats(),
    getMySubscription(),
  ]);

  const profile = profileResult.data;
  const dashboardStats = statsResult.data;
  const subscription = subscriptionResult.data;

  // Get plan details
  const currentPlan = subscription?.plan || "free";
  const planDetails = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan);
  const isFreePlan = currentPlan === "free";
  const now = new Date();
  const daysRemaining = subscription?.endDate
    ? Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const stats = [
    {
      title: "Profiles Viewed",
      value: dashboardStats?.profilesViewedByMe?.toString() || "0",
      change: `${dashboardStats?.todayViewsByMe || 0} today`,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/activity/viewed",
    },
    {
      title: "Interests Received",
      value: dashboardStats?.interestsReceived?.toString() || "0",
      change: `${dashboardStats?.pendingInterests || 0} pending`,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      href: "/interests",
    },
    {
      title: "Accepted Matches",
      value: dashboardStats?.acceptedInterests?.toString() || "0",
      change: "View all",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/interests",
    },
    {
      title: "Unread Messages",
      value: dashboardStats?.unreadMessages?.toString() || "0",
      change: `${dashboardStats?.shortlisted || 0} shortlisted you`,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/messages",
    },
  ];

  return (
    <>
      <Card variant="feature" className="group sm:col-span-1 lg:col-span-2">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-xl">
              <Crown className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
              Your Plan
            </CardTitle>
            <Badge
              variant={isFreePlan ? "secondary" : "default"}
              className="px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-base"
            >
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          {isFreePlan ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm sm:text-base">
                You&apos;re on the free plan. Upgrade to unlock premium features and connect with
                more matches.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-foreground font-semibold">5</div>
                  <div className="text-muted-foreground text-xs">Interests/day</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-foreground font-semibold">0</div>
                  <div className="text-muted-foreground text-xs">Contact views</div>
                </div>
              </div>
              <Button asChild className="shadow-premium-sm hover:shadow-premium-md w-full">
                <Link href="/membership">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan expires in</span>
                <span className="text-foreground font-semibold">
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Expired"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
                  <div className="text-foreground font-semibold">
                    {subscription?.interestsPerDay === 9999 || subscription?.interestsPerDay === -1
                      ? "∞"
                      : (subscription?.interestsPerDay ??
                        planDetails?.features.interestsPerDay ??
                        0)}
                  </div>
                  <div className="text-muted-foreground text-xs">Interests/day</div>
                </div>
                <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
                  <div className="text-foreground font-semibold">
                    {subscription?.contactViews === 9999 || subscription?.contactViews === -1
                      ? "∞"
                      : (subscription?.contactViews ?? planDetails?.features.contactViews ?? 0)}
                  </div>
                  <div className="text-muted-foreground text-xs">Contact views</div>
                </div>
                <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
                  <div className="text-foreground font-semibold">
                    {subscription?.profileBoosts ?? planDetails?.features.profileBoosts ?? 0}
                  </div>
                  <div className="text-muted-foreground text-xs">Boosts left</div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/membership">
                  View Plan Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="feature" className="group sm:col-span-1 lg:col-span-2">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold sm:text-xl">Profile Completion</CardTitle>
            <Badge
              variant={profile?.profileCompletion === 100 ? "default" : "secondary"}
              className="px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-base"
            >
              {profile?.profileCompletion || 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          <Progress value={profile?.profileCompletion || 0} className="h-2 sm:h-3" />
          {(profile?.profileCompletion || 0) < 100 ? (
            (() => {
              const missing = getMissingProfileFields((profile ?? {}) as Record<string, unknown>);
              const hints = missing.slice(0, 3);
              return (
                <div className="space-y-3">
                  <p className="text-muted-foreground mb-3 text-base">
                    Complete your profile to get more matches and visibility.
                  </p>
                  {hints.length > 0 && (
                    <ul className="space-y-2 text-sm">
                      {hints.map((field) => {
                        const meta = FIELD_META[field];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                          <li key={field} className="flex items-center gap-2 text-amber-600">
                            <Icon className="h-4 w-4" />
                            {meta.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Button
                    asChild
                    size="default"
                    className="shadow-premium-sm hover:shadow-premium-md"
                  >
                    <Link href="/profile/edit">
                      Complete Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-600">
                Your profile is complete! You&apos;re getting maximum visibility.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {stats.map((stat, index) => (
        <Link key={stat.title} href={stat.href} className="block">
          <Card
            variant="elevated"
            className={`group animate-fade-in-up stagger-${index + 1} hover:border-primary/30 cursor-pointer transition-colors`}
          >
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
                <div
                  className={`h-10 w-10 rounded-xl sm:h-12 sm:w-12 md:h-14 md:w-14 ${stat.bgColor} shadow-premium-sm flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="group-hover:text-primary text-xl font-bold transition-colors sm:text-2xl md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{stat.change}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  );
}

function StatsLoading() {
  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-4 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-2 w-full" />
          <Skeleton className="h-4 w-60" />
        </CardContent>
      </Card>

      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div>
                <Skeleton className="mb-1 h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

async function RecommendedMatchesSection() {
  const [result, session] = await Promise.all([getRecommendedMatches(5), auth()]);
  const matches = result.data || [];
  const subscriptionPlan = session?.user?.subscriptionPlan || "free";

  if (matches.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">Recommended For You</h2>
        <Button variant="ghost" asChild>
          <Link href="/matches" className="text-brand hover:text-brand/80">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
        {matches.map((profile) => (
          <ProfileCard
            key={profile.userId}
            profile={profile}
            variant="compact"
            showMatchScore={true}
            subscriptionPlan={subscriptionPlan}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendedLoading() {
  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="aspect-[3/4] w-full" />
            <CardContent className="pt-4">
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="container-wide py-4 sm:py-6 md:py-10">
      <div className="from-primary/10 via-primary/5 border-primary/10 relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-4 sm:mb-8 sm:p-6 md:mb-10 md:p-8">
        <div className="bg-primary/5 absolute top-0 right-0 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="mb-2 text-2xl font-bold tracking-tight sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Here&apos;s what&apos;s happening with your profile today.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 md:mb-10 md:gap-6 lg:grid-cols-4">
        <Suspense fallback={<StatsLoading />}>
          <DashboardStats />
        </Suspense>
      </div>

      <Suspense fallback={<RecommendedLoading />}>
        <RecommendedMatchesSection />
      </Suspense>

      <div className="mb-10">
        <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
          <Card variant="elevated" className="group">
            <CardHeader>
              <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                <Users className="text-primary h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Find Matches</CardTitle>
              <CardDescription className="text-base">
                Browse profiles that match your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="shadow-premium-sm hover:shadow-premium-md w-full">
                <Link href="/matches">View Matches</Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 transition-transform group-hover:scale-110">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <CardTitle className="text-xl">Interests</CardTitle>
              <CardDescription className="text-base">
                See who&apos;s interested in you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/interests">View Interests</Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 transition-transform group-hover:scale-110">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle className="text-xl">Upgrade Plan</CardTitle>
              <CardDescription className="text-base">
                Get more features with premium membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/membership">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Quick Links</CardTitle>
          <CardDescription className="text-base">Manage your profile and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="ghost"
              asChild
              className="hover:bg-primary/5 h-12 justify-start text-base"
            >
              <Link href="/profile/edit">
                <Settings className="mr-3 h-5 w-5" />
                Edit Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hover:bg-primary/5 h-12 justify-start text-base"
            >
              <Link href="/profile/edit">
                <ImageIcon className="mr-3 h-5 w-5" />
                Manage Photos
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hover:bg-primary/5 h-12 justify-start text-base"
            >
              <Link href="/profile/preferences">
                <Heart className="mr-3 h-5 w-5" />
                Partner Preferences
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hover:bg-primary/5 h-12 justify-start text-base"
            >
              <Link href="/settings">
                <Settings className="mr-3 h-5 w-5" />
                Account Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
