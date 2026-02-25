import { Suspense } from "react";
import { Metadata } from "next";
import { getMatchingProfiles } from "@/lib/actions/profile";
import { getShortlistedIds } from "@/lib/actions/shortlist";
import { getSentInterests, getDailyInterestStatus } from "@/lib/actions/interests";
import type { DailyInterestStatus } from "@/lib/actions/interests";
import { auth } from "@/lib/auth";
import { MatchesListClient } from "@/components/matching/matches-list-client";
import { MatchesErrorBoundary } from "@/components/matching/matches-error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FilterPanel } from "@/components/matching/filter-panel";
import { MobileFilterWrapper } from "@/components/matching/mobile-filter-wrapper";
import type { SearchFilters } from "@/types";

export const metadata: Metadata = {
  title: "Matches",
  description: "Find your perfect match from verified profiles",
};

function parseSearchFilters(params: Record<string, string | undefined>): SearchFilters {
  const filters: SearchFilters = {};

  if (params.ageMin) {
    const v = parseInt(params.ageMin);
    if (!isNaN(v)) filters.ageMin = v;
  }
  if (params.ageMax) {
    const v = parseInt(params.ageMax);
    if (!isNaN(v)) filters.ageMax = v;
  }
  if (params.heightMin) {
    const v = parseInt(params.heightMin);
    if (!isNaN(v)) filters.heightMin = v;
  }
  if (params.heightMax) {
    const v = parseInt(params.heightMax);
    if (!isNaN(v)) filters.heightMax = v;
  }
  if (params.religion) filters.religion = params.religion.split(",");
  if (params.caste) filters.caste = params.caste.split(",");
  if (params.motherTongue) filters.motherTongue = params.motherTongue.split(",");
  if (params.education) filters.education = params.education.split(",");
  if (params.profession) filters.profession = params.profession.split(",");
  if (params.income) filters.income = params.income.split(",");
  if (params.maritalStatus) filters.maritalStatus = params.maritalStatus.split(",");
  if (params.diet) filters.diet = params.diet.split(",");
  if (params.state) filters.state = params.state.split(",");
  if (params.city) filters.city = params.city.split(",");
  if (params.physicalStatus) filters.physicalStatus = params.physicalStatus;

  return filters;
}

async function MatchesList({ filters }: { filters: SearchFilters }) {
  const session = await auth();

  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  const [result, shortlistResult, sentResult, interestStatusResult] = await Promise.all([
    getMatchingProfiles(hasFilters ? filters : undefined, 1, 20),
    getShortlistedIds(),
    getSentInterests(),
    getDailyInterestStatus(),
  ]);

  if (!result.success) {
    return (
      <Card variant="elevated" className="py-8 text-center sm:py-12 md:py-16">
        <CardContent className="space-y-4 px-4 sm:space-y-6 sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 sm:h-20 sm:w-20">
            <Users className="h-7 w-7 text-red-600 sm:h-10 sm:w-10" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg font-bold text-red-600 sm:text-xl md:text-2xl">
              Error Loading Matches
            </h3>
            <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed sm:text-base md:text-lg">
              {result.error || "An error occurred while loading profiles"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result.data?.profiles.length) {
    return (
      <Card variant="elevated" className="py-8 text-center sm:py-12 md:py-16">
        <CardContent className="space-y-4 px-4 sm:space-y-6 sm:px-6">
          <div className="from-primary/20 to-primary/10 shadow-premium-md mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br sm:h-20 sm:w-20">
            <Users className="text-primary h-7 w-7 sm:h-10 sm:w-10" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg font-bold sm:text-xl md:text-2xl">No Profiles Available</h3>
            <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed sm:text-base md:text-lg">
              There are currently no profiles in the system. This could be because:
              <br />
              • The platform is new and growing
              <br />
              • All profiles are blocked or hidden
              <br />• Try adjusting your filters
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
            <Button variant="outline" asChild size="default">
              <Link href="/profile/preferences">Update Preferences</Link>
            </Button>
            <Button asChild size="default" className="shadow-premium-sm hover:shadow-premium-md">
              <Link href="/profile/edit">Complete Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const shortlistedIds = shortlistResult.data || [];
  const sentInterestIds = (sentResult.data || []).map((i) => i.profile.userId);
  const subscriptionPlan = session?.user?.subscriptionPlan || "free";
  const dailyInterestStatus: DailyInterestStatus =
    interestStatusResult.success && interestStatusResult.data
      ? interestStatusResult.data
      : { sentToday: 0, limit: 5, isUnlimited: false };

  return (
    <MatchesListClient
      profiles={result.data.profiles}
      shortlistedIds={shortlistedIds}
      sentInterestIds={sentInterestIds}
      total={result.data.total}
      subscriptionPlan={subscriptionPlan}
      filters={hasFilters ? filters : undefined}
      seed={result.data.seed}
      dailyInterestStatus={dailyInterestStatus}
    />
  );
}

function MatchesLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="aspect-[4/3] w-full sm:aspect-auto sm:h-[200px] sm:w-44 md:w-48" />
            <CardContent className="flex-1 p-4 sm:p-6">
              <div className="mb-3 flex justify-between">
                <div>
                  <Skeleton className="mb-2 h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="mb-4 flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseSearchFilters(params);

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4 md:mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Matches</h1>
          <p className="text-muted-foreground mt-1">Profiles intelligently ranked for you</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" asChild>
            <Link href="/matches">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Link>
          </Button>
          <MobileFilterWrapper />
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6">
        <aside className="hidden w-64 shrink-0 overflow-hidden xl:block xl:w-72">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Card variant="bordered" className="mb-4 sm:mb-6">
            <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-muted-foreground text-sm">
                  Showing all profiles ranked by compatibility, activity, and trust
                </p>
                <Button
                  variant="ghost"
                  asChild
                  className="text-primary hover:text-primary hover:bg-primary/5"
                >
                  <Link href="/profile/preferences">Edit Partner Preferences</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <MatchesErrorBoundary>
            <Suspense fallback={<MatchesLoading />}>
              <MatchesList filters={filters} />
            </Suspense>
          </MatchesErrorBoundary>
        </div>
      </div>
    </div>
  );
}
