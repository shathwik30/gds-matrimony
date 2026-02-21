"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getViewedByMe } from "@/lib/actions/activity";
import { getInitials } from "@/lib/utils";

interface ViewedProfile {
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

export default function ViewedProfilesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ViewedProfile[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const result = await getViewedByMe(30);
        if (result.success && result.data) {
          setProfiles(result.data);
        }
      } catch (error) {
        console.error("Failed to load viewed profiles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Profiles You Viewed
        </h1>
        <p className="text-muted-foreground mt-2">
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} viewed recently
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No profiles viewed yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Browse matches and click on profiles to view them. They will appear here.
            </p>
            <Button asChild>
              <Link href="/matches">Browse Matches</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((item) => {
            const fullName = [item.viewer.firstName, item.viewer.lastName]
              .filter(Boolean)
              .join(" ") || "Anonymous";
            const initials = getInitials(item.viewer.firstName, item.viewer.lastName);

            return (
              <Link key={item.id} href={`/profile/${item.viewerId}`}>
                <Card variant="elevated" className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 bg-primary/10">
                        {item.viewer.profileImage ? (
                          <Image
                            src={item.viewer.profileImage}
                            alt={fullName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-primary font-semibold text-lg">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                          {fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.viewer.age ? `${item.viewer.age} yrs` : ""}
                          {item.viewer.age && item.viewer.residingCity ? " · " : ""}
                          {item.viewer.residingCity || ""}
                        </p>
                        {item.viewedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Viewed {new Date(item.viewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
