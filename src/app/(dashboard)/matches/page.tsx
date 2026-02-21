import { Suspense } from "react";
import { Metadata } from "next";
import { getMatchingProfiles } from "@/lib/actions/profile";
import { getShortlistedIds } from "@/lib/actions/shortlist";
import { getSentInterests } from "@/lib/actions/interests";
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

  if (params.ageMin) { const v = parseInt(params.ageMin); if (!isNaN(v)) filters.ageMin = v; }
  if (params.ageMax) { const v = parseInt(params.ageMax); if (!isNaN(v)) filters.ageMax = v; }
  if (params.heightMin) { const v = parseInt(params.heightMin); if (!isNaN(v)) filters.heightMin = v; }
  if (params.heightMax) { const v = parseInt(params.heightMax); if (!isNaN(v)) filters.heightMax = v; }
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

async function MatchesList({
  filters,
}: {
  filters: SearchFilters;
}) {
  const session = await auth();

  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  const [result, shortlistResult, sentResult] = await Promise.all([
    getMatchingProfiles(hasFilters ? filters : undefined, 1, 20),
    getShortlistedIds(),
    getSentInterests(),
  ]);

  if (!result.success) {
    return (
      <Card variant="elevated" className="text-center py-16">
        <CardContent className="space-y-6">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Users className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-red-600">Error Loading Matches</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              {result.error || "An error occurred while loading profiles"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result.data?.profiles.length) {
    return (
      <Card variant="elevated" className="text-center py-16">
        <CardContent className="space-y-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto shadow-premium-md">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold">No Profiles Available</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              There are currently no profiles in the system. This could be because:<br/>
              • The platform is new and growing<br/>
              • All profiles are blocked or hidden<br/>
              • Try adjusting your filters
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
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

  return (
    <MatchesListClient
      profiles={result.data.profiles}
      shortlistedIds={shortlistedIds}
      sentInterestIds={sentInterestIds}
      total={result.data.total}
      subscriptionPlan={subscriptionPlan}
      filters={hasFilters ? filters : undefined}
      seed={result.data.seed}
    />
  );
}

function MatchesLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="w-full sm:w-48 aspect-square sm:aspect-auto sm:h-[200px]" />
            <CardContent className="flex-1 p-6">
              <div className="flex justify-between mb-3">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex gap-2 mb-4">
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
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">
            Profiles intelligently ranked for you
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" asChild>
            <Link href="/matches">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Link>
          </Button>
          {/* Filter toggle - visible when filter sidebar is hidden */}
          <MobileFilterWrapper />
        </div>
      </div>

      {/* Two-column layout: filters + matches */}
      <div className="flex gap-6">
        {/* Filter sidebar - show when there's enough room (xl+ since dashboard sidebar takes space at lg+) */}
        <aside className="hidden xl:block w-64 xl:w-72 shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Matches content */}
        <div className="flex-1 min-w-0">
          {/* Quick Action Bar */}
          <Card variant="bordered" className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing all profiles ranked by compatibility, activity, and trust
                </p>
                <Button variant="ghost" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                  <Link href="/profile/preferences">
                    Edit Partner Preferences
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Matches List */}
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
