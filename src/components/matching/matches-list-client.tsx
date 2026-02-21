"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "react-error-boundary";
import { ProfileCard } from "./profile-card";
import { sendInterest } from "@/lib/actions/interests";
import { addToShortlist, removeFromShortlist } from "@/lib/actions/shortlist";
import { getMatchingProfiles } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Loader2, Users, AlertCircle } from "lucide-react";
import type { MatchProfile, SearchFilters } from "@/types";

function ProfileCardFallback() {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-muted-foreground">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      <span>This profile could not be displayed.</span>
    </div>
  );
}

interface MatchesListClientProps {
  profiles: MatchProfile[];
  shortlistedIds: number[];
  sentInterestIds: number[];
  total: number;
  subscriptionPlan: string;
  filters?: SearchFilters;
  seed: string;
}

export function MatchesListClient({
  profiles: initialProfiles,
  shortlistedIds: initialShortlistedIds,
  sentInterestIds: initialSentInterestIds,
  total: initialTotal,
  subscriptionPlan,
  filters,
  seed,
}: MatchesListClientProps) {
  const [allProfiles, setAllProfiles] = useState<MatchProfile[]>(initialProfiles);
  const [shortlistedIds, setShortlistedIds] = useState<Set<number>>(
    new Set(initialShortlistedIds)
  );
  const [sentInterestIds, setSentInterestIds] = useState<Set<number>>(
    new Set(initialSentInterestIds)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      try {
        const nextPage = currentPage + 1;
        const result = await getMatchingProfiles(filters, nextPage, 20, seed);

        if (result.success && result.data?.profiles.length) {
          setCurrentPage(nextPage);
          setAllProfiles((prev) => [...prev, ...result.data!.profiles]);
          setTotalProfiles(result.data.total);
        } else if (!result.success) {
          toast.error(result.error || "Failed to load more profiles");
        }
      } catch {
        toast.error("Failed to load more profiles");
      }
    });
  };

  const handleSendInterest = async (userId: number) => {
    try {
      const result = await sendInterest(userId);
      if (result.success) {
        setSentInterestIds((prev) => new Set([...prev, userId]));
        toast.success(result.message || "Interest sent successfully!", {
          description: "You'll be notified when they respond",
        });
      } else {
        toast.error(result.error || "Failed to send interest");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleShortlist = async (userId: number) => {
    try {
      const isCurrentlyShortlisted = shortlistedIds.has(userId);

      if (isCurrentlyShortlisted) {
        const result = await removeFromShortlist(userId);
        if (result.success) {
          setShortlistedIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
          toast.success("Removed from shortlist");
        } else {
          toast.error(result.error || "Failed to update shortlist");
        }
      } else {
        const result = await addToShortlist(userId);
        if (result.success) {
          setShortlistedIds((prev) => new Set([...prev, userId]));
          toast.success("Added to shortlist");
        } else {
          toast.error(result.error || "Failed to update shortlist");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  // Show load more button if there are more profiles available
  const showLoadMore = allProfiles.length < totalProfiles;

  if (allProfiles.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No matches found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Try adjusting your filters or partner preferences to see more profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {allProfiles.map((profile) => (
        <ErrorBoundary key={profile.id} FallbackComponent={ProfileCardFallback}>
          <ProfileCard
            profile={profile}
            onSendInterest={handleSendInterest}
            onShortlist={handleShortlist}
            isShortlisted={shortlistedIds.has(profile.userId)}
            interestSent={sentInterestIds.has(profile.userId)}
            subscriptionPlan={subscriptionPlan}
          />
        </ErrorBoundary>
      ))}
      {showLoadMore && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Profiles"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
