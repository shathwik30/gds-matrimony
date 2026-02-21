"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Bookmark, MapPin, Briefcase, GraduationCap, Sparkles, ShieldCheck, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn, getInitials, heightToFeetInches, formatLastActive, getBlurDataURL } from "@/lib/utils";
import type { MatchProfile } from "@/types";

function getTrustBadgeClass(level: string | null) {
  switch (level) {
    case "highly_trusted":
      return "trust-badge-highly-trusted";
    case "verified_user":
      return "trust-badge-verified";
    default:
      return "trust-badge-new";
  }
}

function getTrustLabel(level: string | null) {
  switch (level) {
    case "highly_trusted":
      return "Highly Trusted";
    case "verified_user":
      return "Verified";
    default:
      return "New Member";
  }
}

function getMatchScoreClass(score: number) {
  if (score >= 80) return "match-score-high";
  if (score >= 60) return "match-score-medium";
  return "match-score-low";
}

interface ProfileCardProps {
  profile: MatchProfile;
  onSendInterest?: (userId: number) => void;
  onShortlist?: (userId: number) => void;
  isShortlisted?: boolean;
  interestSent?: boolean;
  showMatchScore?: boolean;
  variant?: "default" | "compact";
  subscriptionPlan?: string;
}

export function ProfileCard({
  profile,
  onSendInterest,
  onShortlist,
  isShortlisted = false,
  interestSent = false,
  showMatchScore = true,
  variant = "default",
  subscriptionPlan = "free",
}: ProfileCardProps) {
  const isFreePlan = subscriptionPlan === "free";
  const blurClass = isFreePlan && profile.profileImage ? "blur-sm" : "";
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Anonymous";
  const initials = getInitials(profile.firstName, profile.lastName);
  const lastActiveText = formatLastActive(profile.lastActive, profile.showLastActive);

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Card variant="interactive" className="overflow-hidden group">
          <Link href={`/profile/${profile.userId}`} className="block">
            <div className="relative aspect-[3/4] overflow-hidden">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={fullName}
                  fill
                  placeholder="blur"
                  blurDataURL={getBlurDataURL(300, 400)}
                  className={cn("object-cover transition-transform group-hover:scale-105", blurClass)}
                />
              ) : (
                <div className="h-full w-full profile-image-gradient flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{initials}</span>
                </div>
              )}
              {showMatchScore && profile.matchScore > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={cn(
                        "absolute top-3 right-3 shadow-premium-md cursor-help",
                        getMatchScoreClass(profile.matchScore)
                      )}
                    >
                      {profile.matchScore}% Match
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on your preferences and profile compatibility</p>
                  </TooltipContent>
                </Tooltip>
              )}
            {profile.isSuperInterest && (
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Super Interest
              </Badge>
            )}
            {profile.subscriptionPlan === "platinum" && (
              <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                <Crown className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors flex-1">
                {fullName}
              </h3>
              <div className="flex flex-col gap-1 shrink-0">
                <Badge className={cn(getTrustBadgeClass(profile.trustLevel), "text-xs")}>
                  {getTrustLabel(profile.trustLevel)}
                </Badge>
                {profile.isAadhaarVerified && (
                  <Badge className="bg-green-50 text-green-700 font-medium text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Aadhaar Verified
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {profile.age} yrs, {profile.height ? heightToFeetInches(profile.height) : "-"}
            </p>
            {lastActiveText && (
              <p className="text-xs text-muted-foreground">
                {lastActiveText}
              </p>
            )}
            {(profile.residingCity || profile.residingState) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {profile.residingCity}{profile.residingCity && profile.residingState && ", "}{profile.residingState}
                </span>
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
    <Card variant="elevated" className="overflow-hidden group">
      <div className="flex flex-col sm:flex-row">
        {/* Profile Image */}
        <Link
          href={`/profile/${profile.userId}`}
          className="relative w-full sm:w-56 aspect-square sm:aspect-auto sm:h-auto shrink-0 overflow-hidden"
        >
          {profile.profileImage ? (
            <Image
              src={profile.profileImage}
              alt={fullName}
              fill
              placeholder="blur"
              blurDataURL={getBlurDataURL(224, 300)}
              className={cn("object-cover transition-transform group-hover:scale-105", blurClass)}
            />
          ) : (
            <div className="h-full w-full profile-image-gradient flex items-center justify-center min-h-[200px]">
              <span className="text-5xl font-bold text-white">{initials}</span>
            </div>
          )}
          {showMatchScore && profile.matchScore > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    "absolute top-3 left-3 shadow-premium-md font-semibold cursor-help",
                    getMatchScoreClass(profile.matchScore)
                  )}
                >
                  {profile.matchScore}% Match
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Based on your preferences and profile compatibility</p>
              </TooltipContent>
            </Tooltip>
          )}
          {profile.isSuperInterest && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              Super Interest
            </Badge>
          )}
          {profile.subscriptionPlan === "platinum" && (
            <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
              <Crown className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </Link>

        {/* Profile Details */}
        <CardContent className="flex-1 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${profile.userId}`}>
                <h3 className="font-semibold text-xl hover:text-primary transition-colors truncate">
                  {fullName}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {profile.age} yrs, {profile.height ? heightToFeetInches(profile.height) : "-"}
              </p>
              {lastActiveText && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastActiveText}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge className={cn(getTrustBadgeClass(profile.trustLevel))}>
                {getTrustLabel(profile.trustLevel)}
              </Badge>
              {profile.isAadhaarVerified && (
                <Badge className="bg-green-50 text-green-700 font-medium">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Aadhaar Verified
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2.5 mb-5 text-sm">
            {(profile.residingCity || profile.residingState) && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">
                  {profile.residingCity}{profile.residingCity && profile.residingState && ", "}{profile.residingState}
                </span>
              </div>
            )}
            {profile.occupation && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">{profile.occupation}</span>
              </div>
            )}
            {profile.highestEducation && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">{profile.highestEducation}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {profile.religion && (
              <Badge variant="secondary" className="font-medium">{profile.religion}</Badge>
            )}
            {profile.caste && (
              <Badge variant="secondary" className="font-medium">{profile.caste}</Badge>
            )}
            {profile.motherTongue && (
              <Badge variant="secondary" className="font-medium">{profile.motherTongue}</Badge>
            )}
          </div>

          {profile.aboutMe && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
              {profile.aboutMe}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <Button
              size="default"
              onClick={() => onSendInterest?.(profile.userId)}
              disabled={interestSent}
              className="flex-1 sm:flex-auto shadow-premium-sm hover:shadow-premium-md"
            >
              <Heart
                className={cn("h-4 w-4", interestSent && "fill-current")}
              />
              <span className="ml-2">{interestSent ? "Interest Sent" : "Send Interest"}</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onShortlist?.(profile.userId)}
              aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
              className="shrink-0"
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isShortlisted && "fill-current text-primary"
                )}
              />
            </Button>
            <Button size="icon" variant="outline" asChild className="shrink-0">
              <Link href={`/profile/${profile.userId}`} aria-label="View profile">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
    </TooltipProvider>
  );
}
