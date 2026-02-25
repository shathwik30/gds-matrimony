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
  firstName:        { icon: User, label: "Add your first name" },
  lastName:         { icon: User, label: "Add your last name" },
  gender:           { icon: User, label: "Select your gender" },
  dateOfBirth:      { icon: User, label: "Add date of birth" },
  height:           { icon: Ruler, label: "Add your height" },
  weight:           { icon: Ruler, label: "Add your weight" },
  religion:         { icon: BookOpen, label: "Select your religion" },
  caste:            { icon: BookOpen, label: "Add your caste" },
  motherTongue:     { icon: BookOpen, label: "Add mother tongue" },
  countryLivingIn:  { icon: MapPin, label: "Add country of residence" },
  residingState:    { icon: MapPin, label: "Add your state" },
  residingCity:     { icon: MapPin, label: "Add your city" },
  highestEducation: { icon: GraduationCap, label: "Add your education" },
  occupation:       { icon: Briefcase, label: "Add your occupation" },
  annualIncome:     { icon: Wallet, label: "Add annual income" },
  maritalStatus:    { icon: Heart, label: "Select marital status" },
  familyStatus:     { icon: Users, label: "Add family status" },
  familyType:       { icon: Users, label: "Add family type" },
  profileImage:     { icon: Camera, label: "Add a profile photo" },
  aboutMe:          { icon: FileText, label: "Write about yourself" },
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
  const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
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
      {/* Subscription Status Card */}
      <Card variant="feature" className="sm:col-span-1 lg:col-span-2 group">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Your Plan
            </CardTitle>
            <Badge
              variant={isFreePlan ? "secondary" : "default"}
              className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 font-semibold"
            >
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          {isFreePlan ? (
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-muted-foreground">
                You&apos;re on the free plan. Upgrade to unlock premium features and connect with more matches.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold text-foreground">5</div>
                  <div className="text-muted-foreground text-xs">Interests/day</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold text-foreground">0</div>
                  <div className="text-muted-foreground text-xs">Contact views</div>
                </div>
              </div>
              <Button asChild className="w-full shadow-premium-sm hover:shadow-premium-md">
                <Link href="/membership">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan expires in</span>
                <span className="font-semibold text-foreground">
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Expired"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="font-semibold text-foreground">
                    {(subscription?.interestsPerDay === 9999 || subscription?.interestsPerDay === -1)
                      ? "∞"
                      : subscription?.interestsPerDay ?? planDetails?.features.interestsPerDay ?? 0}
                  </div>
                  <div className="text-muted-foreground text-xs">Interests/day</div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="font-semibold text-foreground">
                    {(subscription?.contactViews === 9999 || subscription?.contactViews === -1)
                      ? "∞"
                      : subscription?.contactViews ?? planDetails?.features.contactViews ?? 0}
                  </div>
                  <div className="text-muted-foreground text-xs">Contact views</div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="font-semibold text-foreground">
                    {subscription?.profileBoosts ?? planDetails?.features.profileBoosts ?? 0}
                  </div>
                  <div className="text-muted-foreground text-xs">Boosts left</div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/membership">
                  View Plan Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Completion Card */}
      <Card variant="feature" className="sm:col-span-1 lg:col-span-2 group">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-xl font-bold">Profile Completion</CardTitle>
            <Badge
              variant={profile?.profileCompletion === 100 ? "default" : "secondary"}
              className="text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 font-semibold"
            >
              {profile?.profileCompletion || 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          <Progress value={profile?.profileCompletion || 0} className="h-2 sm:h-3" />
          {(profile?.profileCompletion || 0) < 100 ? (
            (() => {
              const missing = getMissingProfileFields((profile ?? {}) as Record<string, unknown>);
              const hints = missing.slice(0, 3);
              return (
                <div className="space-y-3">
                  <p className="text-base text-muted-foreground mb-3">
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
                  <Button asChild size="default" className="shadow-premium-sm hover:shadow-premium-md">
                    <Link href="/profile/edit">
                      Complete Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-green-600 font-medium">
                Your profile is complete! You&apos;re getting maximum visibility.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats.map((stat, index) => (
        <Link key={stat.title} href={stat.href} className="block">
          <Card variant="elevated" className={`group animate-fade-in-up stagger-${index + 1} cursor-pointer hover:border-primary/30 transition-colors`}>
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-premium-sm group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.change}</p>
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
      {/* Subscription Card Skeleton */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Card Skeleton */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-2 w-full mb-4" />
          <Skeleton className="h-4 w-60" />
        </CardContent>
      </Card>

      {/* Stat Cards Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
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
  const [result, session] = await Promise.all([
    getRecommendedMatches(5),
    auth(),
  ]);
  const matches = result.data || [];
  const subscriptionPlan = session?.user?.subscriptionPlan || "free";

  if (matches.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Recommended For You</h2>
        <Button variant="ghost" asChild>
          <Link href="/matches" className="text-brand hover:text-brand/80">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(profile => (
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
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <Skeleton className="aspect-[3/4] w-full" />
            <CardContent className="pt-4">
              <Skeleton className="h-6 w-32 mb-2" />
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
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8 md:mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 md:p-8 border border-primary/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Here&apos;s what&apos;s happening with your profile today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 md:mb-10">
        <Suspense fallback={<StatsLoading />}>
          <DashboardStats />
        </Suspense>
      </div>

      {/* Recommended Matches */}
      <Suspense fallback={<RecommendedLoading />}>
        <RecommendedMatchesSection />
      </Suspense>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="elevated" className="group">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Find Matches</CardTitle>
              <CardDescription className="text-base">
                Browse profiles that match your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full shadow-premium-sm hover:shadow-premium-md">
                <Link href="/matches">View Matches</Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-pink-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
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
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
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

      {/* Quick Links */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Quick Links</CardTitle>
          <CardDescription className="text-base">
            Manage your profile and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="ghost" asChild className="justify-start h-12 text-base hover:bg-primary/5">
              <Link href="/profile/edit">
                <Settings className="mr-3 h-5 w-5" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start h-12 text-base hover:bg-primary/5">
              <Link href="/profile/edit">
                <ImageIcon className="mr-3 h-5 w-5" />
                Manage Photos
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start h-12 text-base hover:bg-primary/5">
              <Link href="/profile/preferences">
                <Heart className="mr-3 h-5 w-5" />
                Partner Preferences
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start h-12 text-base hover:bg-primary/5">
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
