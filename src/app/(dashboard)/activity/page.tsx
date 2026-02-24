"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  Heart,
  Check,
  Star,
  Clock,
  TrendingUp,
  Crown,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecentActivity, getProfileViewers, getDashboardStats } from "@/lib/actions/activity";
import { getMySubscriptionPlan } from "@/lib/actions/messages";
import type { DashboardStats } from "@/types";
import { getInitials } from "@/lib/utils";

interface ActivityItem {
  id: number;
  type: "view" | "interest_received" | "interest_accepted" | "shortlist";
  title: string;
  description: string;
  createdAt: Date;
  user?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

interface ProfileViewData {
  id: number;
  viewerId: number;
  viewedAt: Date | null;
  viewer: {
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    age?: number;
    residingCity: string | null;
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card variant="elevated" className="group animate-fade-in-up">
      <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl ${bgColor} flex items-center justify-center shadow-premium-sm group-hover:scale-110 transition-transform`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${color}`} />
          </div>
          <div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">{value}</p>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
          </div>
        </div>
        {trend && (
          <p className="text-sm text-green-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const getIcon = () => {
    switch (activity.type) {
      case "view":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "interest_received":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "interest_accepted":
        return <Check className="h-4 w-4 text-green-500" />;
      case "shortlist":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-b last:border-0">
      {activity.user ? (
        <Link href={`/profile/${activity.user.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.user.profileImage || undefined} />
            <AvatarFallback className="bg-brand-light text-brand text-sm">
              {getInitials(activity.user.firstName, activity.user.lastName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          {getIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            {getIcon()}
          </span>
          <p className="font-medium truncate">{activity.title}</p>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {activity.description}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(activity.createdAt)}
      </span>
    </div>
  );
}

function ViewerCard({ viewer }: { viewer: ProfileViewData }) {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Link
      href={`/profile/${viewer.viewerId}`}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={viewer.viewer.profileImage || undefined} />
        <AvatarFallback className="bg-brand-light text-brand">
          {getInitials(viewer.viewer.firstName, viewer.viewer.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {viewer.viewer.firstName} {viewer.viewer.lastName}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {viewer.viewer.age && `${viewer.viewer.age} yrs`}
          {viewer.viewer.age && viewer.viewer.residingCity && " | "}
          {viewer.viewer.residingCity}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(viewer.viewedAt)}
      </span>
    </Link>
  );
}

export default function ActivityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [viewers, setViewers] = useState<ProfileViewData[]>([]);
  const [plan, setPlan] = useState<string>("free");

  const canSeeViewers = ["silver", "gold", "platinum"].includes(plan);
  const canSeeWhoLiked = ["gold", "platinum"].includes(plan);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResult, activityResult, viewersResult, planResult] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
        getProfileViewers(),
        getMySubscriptionPlan(),
      ]);

      if (planResult.success && planResult.data) {
        setPlan(planResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      if (activityResult.success && activityResult.data) {
        setActivities(activityResult.data);
      }
      if (viewersResult.success && viewersResult.data) {
        setViewers(viewersResult.data);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
      toast.error("Failed to load activity");
    } finally {
      setIsLoading(false);
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
    <div className="container-wide py-6 sm:py-8 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Activity</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1 sm:mt-2">
          See who viewed your profile and track your activity
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <StatCard
            title="Profile Views"
            value={stats.profileViews}
            icon={Eye}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend={stats.todayViews > 0 ? `+${stats.todayViews} today` : undefined}
          />
          <StatCard
            title="Interests Received"
            value={stats.interestsReceived}
            icon={Heart}
            color="text-pink-600"
            bgColor="bg-pink-100"
            trend={
              stats.pendingInterests > 0
                ? `${stats.pendingInterests} pending`
                : undefined
            }
          />
          <StatCard
            title="Interests Sent"
            value={stats.interestsSent}
            icon={Heart}
            color="text-amber-600"
            bgColor="bg-amber-100"
          />
          <StatCard
            title="Accepted"
            value={stats.acceptedInterests}
            icon={Check}
            color="text-green-600"
            bgColor="bg-green-100"
          />
        </div>
      )}

      <Tabs defaultValue="activity" className="space-y-4 sm:space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="viewers">
            Profile Viewers
            {viewers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {viewers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent interactions and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!canSeeWhoLiked && !canSeeViewers ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Upgrade to Silver to see profile views, or Gold to also see who sent you interests.
                  </p>
                  <Button asChild>
                    <Link href="/membership">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">
                    Your activity will appear here as you interact with other profiles
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewers">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Who Viewed Your Profile</CardTitle>
              <CardDescription>
                People who recently viewed your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!canSeeViewers ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Silver Plan Required</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Upgrade to Silver or higher to see who viewed your profile.
                  </p>
                  <Button asChild>
                    <Link href="/membership">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </Button>
                </div>
              ) : viewers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No profile views yet</p>
                  <p className="text-sm">
                    Complete your profile to attract more visitors
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {viewers.map((viewer) => (
                    <ViewerCard key={viewer.id} viewer={viewer} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
