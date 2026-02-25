"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Eye,
  Bookmark,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn, getInitials, heightToFeetInches, formatLastActive, getBlurDataURL } from "@/lib/utils";
import { TRUST_BADGE_CLASSES, TRUST_LABELS, MATCH_SCORE_CLASSES } from "@/constants";
import type { MatchProfile } from "@/types";

function getTrustBadgeClass(level: string | null) {
  return TRUST_BADGE_CLASSES[level ?? ""] ?? TRUST_BADGE_CLASSES.new_member;
}

function getTrustLabel(level: string | null) {
  return TRUST_LABELS[level ?? ""] ?? TRUST_LABELS.new_member;
}

function getMatchScoreClass(score: number) {
  if (score >= MATCH_SCORE_CLASSES.high.min) return MATCH_SCORE_CLASSES.high.className;
  if (score >= MATCH_SCORE_CLASSES.medium.min) return MATCH_SCORE_CLASSES.medium.className;
  return MATCH_SCORE_CLASSES.low.className;
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
        <Card variant="interactive" className="group overflow-hidden">
          <Link href={`/profile/${profile.userId}`} className="block">
            <div className="relative aspect-[3/4] overflow-hidden">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={fullName}
                  fill
                  placeholder="blur"
                  blurDataURL={getBlurDataURL(300, 400)}
                  className={cn(
                    "object-cover transition-transform group-hover:scale-105",
                    blurClass
                  )}
                />
              ) : (
                <div className="profile-image-gradient flex h-full w-full items-center justify-center">
                  <span className="text-4xl font-bold text-white">{initials}</span>
                </div>
              )}
              {showMatchScore && profile.matchScore > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={cn(
                        "shadow-premium-md absolute top-2 right-2 cursor-help text-[10px] sm:top-3 sm:right-3 sm:text-xs",
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
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] text-white shadow-lg sm:top-3 sm:left-3 sm:text-xs">
                  <Sparkles className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                  Super Interest
                </Badge>
              )}
              {profile.subscriptionPlan === "platinum" && (
                <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-[10px] text-white shadow-lg sm:bottom-3 sm:left-3 sm:text-xs">
                  <Crown className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                  Featured
                </Badge>
              )}
            </div>
            <CardContent className="space-y-1.5 p-3 sm:space-y-2 sm:p-5">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <h3 className="group-hover:text-primary flex-1 truncate text-base font-semibold transition-colors sm:text-lg">
                  {fullName}
                </h3>
                <div className="flex shrink-0 flex-col gap-1">
                  <Badge
                    className={cn(getTrustBadgeClass(profile.trustLevel), "text-[10px] sm:text-xs")}
                  >
                    {getTrustLabel(profile.trustLevel)}
                  </Badge>
                  {profile.isAadhaarVerified && (
                    <Badge className="bg-green-50 text-[10px] font-medium text-green-700 sm:text-xs">
                      <ShieldCheck className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                      Aadhaar Verified
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-xs font-medium sm:text-sm">
                {profile.age} yrs, {profile.height ? heightToFeetInches(profile.height) : "-"}
              </p>
              {lastActiveText && <p className="text-muted-foreground text-xs">{lastActiveText}</p>}
              {(profile.residingCity || profile.residingState) && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {profile.residingCity}
                    {profile.residingCity && profile.residingState && ", "}
                    {profile.residingState}
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
      <Card variant="elevated" className="group overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <Link
            href={`/profile/${profile.userId}`}
            className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:min-h-[240px] sm:w-44 md:w-56"
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
              <div className="profile-image-gradient flex h-full min-h-[240px] w-full items-center justify-center">
                <span className="text-5xl font-bold text-white">{initials}</span>
              </div>
            )}
            {showMatchScore && profile.matchScore > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      "shadow-premium-md absolute top-2 left-2 cursor-help text-[10px] font-semibold sm:top-3 sm:left-3 sm:text-xs",
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
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] text-white shadow-lg sm:top-3 sm:right-3 sm:text-xs">
                <Sparkles className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                Super Interest
              </Badge>
            )}
            {profile.subscriptionPlan === "platinum" && (
              <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-[10px] text-white shadow-lg sm:bottom-3 sm:left-3 sm:text-xs">
                <Crown className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                Featured
              </Badge>
            )}
          </Link>

          <CardContent className="flex-1 p-4 sm:p-5 md:p-6">
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${profile.userId}`}>
                  <h3 className="hover:text-primary truncate text-base font-semibold transition-colors sm:text-lg md:text-xl">
                    {fullName}
                  </h3>
                </Link>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                  {profile.age} yrs, {profile.height ? heightToFeetInches(profile.height) : "-"}
                </p>
                {lastActiveText && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{lastActiveText}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge className={cn(getTrustBadgeClass(profile.trustLevel))}>
                  {getTrustLabel(profile.trustLevel)}
                </Badge>
                {profile.isAadhaarVerified && (
                  <Badge className="bg-green-50 font-medium text-green-700">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Aadhaar Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-3 space-y-2 text-xs sm:mb-5 sm:space-y-2.5 sm:text-sm">
              {(profile.residingCity || profile.residingState) && (
                <div className="text-muted-foreground flex items-center gap-2.5">
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <MapPin className="text-primary h-4 w-4" />
                  </div>
                  <span className="truncate">
                    {profile.residingCity}
                    {profile.residingCity && profile.residingState && ", "}
                    {profile.residingState}
                  </span>
                </div>
              )}
              {profile.occupation && (
                <div className="text-muted-foreground flex items-center gap-2.5">
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <Briefcase className="text-primary h-4 w-4" />
                  </div>
                  <span className="truncate">{profile.occupation}</span>
                </div>
              )}
              {profile.highestEducation && (
                <div className="text-muted-foreground flex items-center gap-2.5">
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <GraduationCap className="text-primary h-4 w-4" />
                  </div>
                  <span className="truncate">{profile.highestEducation}</span>
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-5 sm:gap-2">
              {profile.religion && (
                <Badge variant="secondary" className="font-medium">
                  {profile.religion}
                </Badge>
              )}
              {profile.caste && (
                <Badge variant="secondary" className="font-medium">
                  {profile.caste}
                </Badge>
              )}
              {profile.motherTongue && (
                <Badge variant="secondary" className="font-medium">
                  {profile.motherTongue}
                </Badge>
              )}
            </div>

            {profile.aboutMe && (
              <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-relaxed sm:mb-5 sm:text-sm">
                {profile.aboutMe}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 sm:gap-2.5 sm:pt-2">
              <Button
                size="default"
                onClick={() => onSendInterest?.(profile.userId)}
                disabled={interestSent}
                className="shadow-premium-sm hover:shadow-premium-md flex-1 sm:flex-auto"
              >
                <Heart className={cn("h-4 w-4", interestSent && "fill-current")} />
                <span className="ml-2">{interestSent ? "Interest Sent" : "Send Interest"}</span>
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onShortlist?.(profile.userId)}
                aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                className="shrink-0"
              >
                <Bookmark className={cn("h-4 w-4", isShortlisted && "text-primary fill-current")} />
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
