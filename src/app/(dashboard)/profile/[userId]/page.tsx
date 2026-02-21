"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2,
  Heart,
  MessageCircle,
  MapPin,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Calendar,
  BadgeCheck,
  MoreVertical,
  ShieldAlert,
  Ban,
  Phone,
  Mail,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/profile/detail-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfileById } from "@/lib/actions/profile";
import { sendInterest } from "@/lib/actions/interests";
import { blockUser, reportUser } from "@/lib/actions/block-report";
import { recordProfileView } from "@/lib/actions/activity";
import { getMySubscription } from "@/lib/actions/subscription";
import type { MatchProfile } from "@/types";
import { heightToFeetInches, getInitials } from "@/lib/utils";

interface ProfileDetailPageProps {
  params: Promise<{ userId: string }>;
}

const REPORT_REASONS = [
  "Fake profile",
  "Inappropriate content",
  "Harassment",
  "Spam",
  "Misleading information",
  "Other",
];

export default function ProfileDetailPage({ params }: ProfileDetailPageProps) {
  const { userId } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        toast.error("Invalid profile ID");
        setIsLoading(false);
        return;
      }

      const result = await getProfileById(userIdNum);
      if (result.success && result.data) {
        setProfile(result.data);
        // Record profile view (fire-and-forget)
        recordProfileView(userIdNum).catch(() => {});
      } else {
        toast.error(result.error || "Failed to load profile");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    // Fetch user's subscription to show context-aware messages
    getMySubscription().then((result) => {
      if (result.success && result.data) {
        setUserPlan(result.data.plan);
      }
    });
  }, []);

  const handleSendInterest = async () => {
    if (!profile || interestSent) return;

    setIsSendingInterest(true);
    try {
      const result = await sendInterest(profile.userId);
      if (result.success) {
        setInterestSent(true);
        toast.success(result.message);
      } else {
        if (result.error === "Interest already sent") {
          setInterestSent(true);
        }
        toast.error(result.error || "Failed to send interest");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSendingInterest(false);
    }
  };

  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    if (!profile || isBlocking) return;

    setIsBlocking(true);
    try {
      const result = await blockUser(profile.userId);
      if (result.success) {
        toast.success(result.message || "User blocked");
      } else {
        toast.error(result.error || "Failed to block user");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!profile || !reportReason) return;

    setIsSubmittingReport(true);
    try {
      const result = await reportUser(profile.userId, reportReason, reportDescription);
      if (result.success) {
        toast.success(result.message);
        setShowReportDialog(false);
        setReportReason("");
        setReportDescription("");
      } else {
        toast.error(result.error || "Failed to submit report");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-wide py-16 text-center">
        <Card variant="elevated" className="max-w-md mx-auto">
          <CardContent className="pt-12 pb-12 space-y-6">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ArrowLeft className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Profile Not Found</h1>
              <p className="text-muted-foreground">
                This profile may have been hidden or deleted.
              </p>
            </div>
            <Button asChild size="default" className="shadow-premium-sm hover:shadow-premium-md">
              <Link href="/matches">Browse Matches</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6 hover:bg-primary/5" asChild>
        <Link href="/matches">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Matches
        </Link>
      </Button>

      {/* Profile Header */}
      <Card variant="elevated" className="overflow-hidden mb-8 group">
        <div className="relative h-80 md:h-96 bg-gradient-to-br from-brand-light to-brand-light/50">
          {profile.profileImage ? (
            <>
              <Image
                src={profile.profileImage}
                alt={`${profile.firstName}'s photo`}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                  !profile.canViewPhoto ? "blur-xl scale-110" : ""
                }`}
              />
              {!profile.canViewPhoto && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4 text-center text-white">
                    <Crown className="h-7 w-7 mx-auto mb-2 text-amber-400" />
                    <p className="font-semibold text-sm">Accept interest to view photo</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-7xl font-bold">
              {getInitials(profile.firstName, profile.lastName)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.trustLevel === "verified_user" && (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <BadgeCheck className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <p className="text-xl font-medium mb-2">
              {profile.age} years{profile.height ? ` • ${heightToFeetInches(profile.height)}` : ""}
            </p>
            {profile.residingCity && (
              <p className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                {profile.residingCity}, {profile.residingState}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <CardContent className="py-6 bg-gradient-to-b from-muted/30 to-transparent">
          <div className="flex gap-3 flex-wrap items-center">
            <Button onClick={handleSendInterest} disabled={isSendingInterest || interestSent} size="default" className="shadow-premium-sm hover:shadow-premium-md">
              {isSendingInterest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 mr-2 ${interestSent ? "fill-current" : ""}`} />
              )}
              {interestSent ? "Interest Sent" : "Send Interest"}
            </Button>
            <Button variant="outline" asChild size="default">
              <Link href={`/messages?userId=${profile.userId}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>

            {/* Block/Report Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-premium-lg">
                <DropdownMenuItem onClick={handleBlock}>
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowReportDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Info (for premium + accepted interest) */}
        {(profile.email || profile.phoneNumber) && (
          <Card variant="feature" className="md:col-span-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3 text-green-700">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${profile.email}`} className="text-sm hover:underline">
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${profile.phoneNumber}`} className="text-sm hover:underline">
                    {profile.phoneNumber}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA (when no contact info available) */}
        {!profile.email && !profile.phoneNumber && (
          <Card variant="bordered" className="md:col-span-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/50">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Crown className="h-7 w-7 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">View Contact Details</p>
                    {!userPlan || userPlan === "free" ? (
                      <p className="text-sm text-muted-foreground">
                        Upgrade to a premium plan to view contact information.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Send interest and get it accepted to view contact information.
                      </p>
                    )}
                  </div>
                </div>
                {!userPlan || userPlan === "free" ? (
                  <Button size="default" asChild className="shadow-premium-sm hover:shadow-premium-md shrink-0">
                    <Link href="/membership">Upgrade</Link>
                  </Button>
                ) : (
                  <Button
                    size="default"
                    onClick={handleSendInterest}
                    disabled={isSendingInterest || interestSent}
                    className="shadow-premium-sm hover:shadow-premium-md shrink-0"
                  >
                    {isSendingInterest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 mr-2 ${interestSent ? "fill-current" : ""}`} />
                    )}
                    {interestSent ? "Interest Sent" : "Send Interest"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        {profile.aboutMe && (
          <Card variant="elevated" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-base">
                {profile.aboutMe}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {profile.images && profile.images.length > 0 && (
          <Card variant="elevated" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-3 ${
                profile.images.length === 1 ? "grid-cols-1" :
                profile.images.length === 2 ? "grid-cols-2" :
                profile.images.length === 3 ? "grid-cols-3" :
                "grid-cols-2 md:grid-cols-4"
              }`}>
                {profile.images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative overflow-hidden rounded-xl bg-muted ${
                      profile.images!.length === 1 ? "aspect-[4/3]" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={img.imageUrl}
                      alt="Gallery photo"
                      fill
                      className={`object-cover transition-all duration-300 hover:scale-105 ${
                        !profile.canViewPhoto ? "blur-lg scale-110" : ""
                      }`}
                    />
                    {!profile.canViewPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2 text-white text-xs font-medium text-center">
                          <Crown className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                          Locked
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Details */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Age" value={`${profile.age} years`} />
            {profile.height && (
              <DetailRow
                label="Height"
                value={heightToFeetInches(profile.height)}
              />
            )}
            {profile.gender && (
              <DetailRow
                label="Gender"
                value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
              />
            )}
            {profile.dateOfBirth && (
              <DetailRow
                label="Date of Birth"
                value={new Date(profile.dateOfBirth).toLocaleDateString()}
              />
            )}
          </CardContent>
        </Card>

        {/* Religion & Location */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              Religion & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.religion && (
              <DetailRow
                label="Religion"
                value={profile.religion.charAt(0).toUpperCase() + profile.religion.slice(1)}
              />
            )}
            {profile.caste && (
              <DetailRow
                label="Caste"
                value={profile.caste}
              />
            )}
            {profile.motherTongue && (
              <DetailRow
                label="Mother Tongue"
                value={profile.motherTongue.charAt(0).toUpperCase() + profile.motherTongue.slice(1)}
              />
            )}
            {profile.residingCity && (
              <DetailRow
                label="Location"
                value={`${profile.residingCity}, ${profile.residingState}`}
              />
            )}
          </CardContent>
        </Card>

        {/* Education & Career */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              Education & Career
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.highestEducation && (
              <DetailRow
                label="Education"
                value={profile.highestEducation.replace(/_/g, " ")}
              />
            )}
            {profile.occupation && (
              <DetailRow
                label="Occupation"
                value={profile.occupation.replace(/_/g, " ")}
              />
            )}
            {profile.annualIncome && (
              <DetailRow
                label="Annual Income"
                value={profile.annualIncome.replace(/_/g, " ")}
              />
            )}
          </CardContent>
        </Card>

        {/* Profile Stats */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              Profile Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Profile Completion"
              value={`${profile.profileCompletion}%`}
            />
            {profile.trustLevel && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trust Level</span>
                <Badge
                  variant={
                    profile.trustLevel === "verified_user"
                      ? "default"
                      : "secondary"
                  }
                >
                  {profile.trustLevel.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
            {profile.lastActive && (
              <DetailRow
                label="Last Active"
                value={new Date(profile.lastActive).toLocaleDateString()}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please select a reason for reporting this profile. Our team will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details (optional)</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more details about your report..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={!reportReason || isSubmittingReport}
            >
              {isSubmittingReport && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

