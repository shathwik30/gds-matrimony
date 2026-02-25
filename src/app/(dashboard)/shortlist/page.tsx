"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Bookmark, ArrowLeft, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyShortlist, removeFromShortlist } from "@/lib/actions/shortlist";
import type { ShortlistProfile } from "@/lib/actions/shortlist";
import { getInitials, calculateAge } from "@/lib/utils";

export default function ShortlistPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ShortlistProfile[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const result = await getMyShortlist();
        if (result.success && result.data) {
          setProfiles(result.data);
        }
      } catch (error) {
        console.error("Failed to load shortlist:", error);
        toast.error("Failed to load shortlist");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleRemove = async (userId: number) => {
    setRemovingIds((prev) => new Set(prev).add(userId));
    try {
      const result = await removeFromShortlist(userId);
      if (result.success) {
        setProfiles((prev) => prev.filter((p) => p.shortlistedUserId !== userId));
        toast.success("Removed from shortlist");
      } else {
        toast.error(result.error || "Failed to remove");
      }
    } catch (error) {
      console.error("Failed to remove from shortlist:", error);
      toast.error("Failed to remove from shortlist");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-wide px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">My Shortlist</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} shortlisted
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card variant="elevated" className="py-16 text-center">
          <CardContent className="space-y-4">
            <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Bookmark className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">No shortlisted profiles</h3>
            <p className="text-muted-foreground mx-auto max-w-md">
              Browse matches and shortlist profiles you are interested in. They will appear here for
              easy access.
            </p>
            <Button asChild>
              <Link href="/matches">Browse Matches</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((item) => {
            if (!item.profile) return null;

            const { profile } = item;
            const fullName =
              [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Anonymous";
            const initials = getInitials(profile.firstName, profile.lastName);
            const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
            const isRemoving = removingIds.has(item.shortlistedUserId);

            return (
              <Card key={item.id} variant="elevated" className="group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <Link
                      href={`/profile/${profile.userId}`}
                      className="bg-primary/10 relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
                    >
                      {profile.profileImage ? (
                        <Image
                          src={profile.profileImage}
                          alt={fullName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-primary flex h-full w-full items-center justify-center text-lg font-semibold">
                          {initials}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile/${profile.userId}`}>
                        <p className="group-hover:text-primary truncate text-base font-semibold transition-colors">
                          {fullName}
                        </p>
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {age ? `${age} yrs` : ""}
                        {age && profile.residingCity ? " · " : ""}
                        {profile.residingCity || ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.residingState && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {profile.residingState}
                          </Badge>
                        )}
                        {profile.highestEducation && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <GraduationCap className="h-3 w-3" />
                            {profile.highestEducation}
                          </Badge>
                        )}
                        {profile.occupation && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Briefcase className="h-3 w-3" />
                            {profile.occupation}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemove(item.shortlistedUserId)}
                      disabled={isRemoving}
                      title="Remove from shortlist"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Bookmark className="h-5 w-5 fill-current" />
                      )}
                    </Button>
                  </div>
                  {item.createdAt && (
                    <div className="px-4 pt-0 pb-3">
                      <p className="text-muted-foreground text-xs">
                        Shortlisted on{" "}
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
