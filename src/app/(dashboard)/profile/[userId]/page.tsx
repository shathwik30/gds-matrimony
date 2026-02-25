"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
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
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
import { revealContact, getTotalContactViews } from "@/lib/actions/contact-packs";
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

  const [contactViewsRemaining, setContactViewsRemaining] = useState<number | null>(null);
  const [isUnlimitedViews, setIsUnlimitedViews] = useState(false);
  const [isRevealingContact, setIsRevealingContact] = useState(false);
  const [revealedContact, setRevealedContact] = useState<{ email?: string; phone?: string } | null>(
    null
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const allImages = profile
    ? [
        ...(profile.profileImage ? [{ id: 0, imageUrl: profile.profileImage }] : []),
        ...(profile.images || []).filter((img) => img.imageUrl !== profile.profileImage),
      ]
    : [];

  const openLightbox = (index: number) => {
    if (!profile?.canViewPhoto) return;
    setLightboxIndex(index);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const goToPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomLevel <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...panPosition };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanPosition({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-") handleZoomOut();
      else if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, allImages.length]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

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
    getMySubscription().then((result) => {
      if (result.success && result.data) {
        setUserPlan(result.data.plan);
      }
    });
    getTotalContactViews().then((result) => {
      if (result.success && result.data) {
        setIsUnlimitedViews(result.data.isUnlimitedSub);
        setContactViewsRemaining(result.data.total);
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

  const handleRevealContact = async () => {
    if (!profile || isRevealingContact) return;

    setIsRevealingContact(true);
    try {
      const result = await revealContact(profile.userId);
      if (result.success && result.data) {
        setRevealedContact(result.data);
        const balanceResult = await getTotalContactViews();
        if (balanceResult.success && balanceResult.data) {
          setIsUnlimitedViews(balanceResult.data.isUnlimitedSub);
          setContactViewsRemaining(balanceResult.data.total);
        }
        toast.success("Contact details revealed!");
      } else {
        toast.error(result.error || "Failed to reveal contact");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsRevealingContact(false);
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
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-wide py-16 text-center">
        <Card variant="elevated" className="mx-auto max-w-md">
          <CardContent className="space-y-6 pt-12 pb-12">
            <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <ArrowLeft className="text-muted-foreground h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Profile Not Found</h1>
              <p className="text-muted-foreground">This profile may have been hidden or deleted.</p>
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button variant="ghost" className="hover:bg-primary/5 mb-6" asChild>
        <Link href="/matches">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Link>
      </Button>

      <Card variant="elevated" className="group mb-8 overflow-hidden">
        <div
          className={`from-brand-light to-brand-light/50 relative h-80 bg-gradient-to-br md:h-96 ${
            profile.canViewPhoto && profile.profileImage ? "cursor-pointer" : ""
          }`}
          onClick={() => profile.canViewPhoto && profile.profileImage && openLightbox(0)}
        >
          {profile.profileImage ? (
            <>
              <Image
                src={profile.profileImage}
                alt={`${profile.firstName}'s photo`}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                  !profile.canViewPhoto ? "scale-110 blur-xl" : ""
                }`}
              />
              {!profile.canViewPhoto && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
                  <div className="rounded-2xl bg-black/50 px-6 py-4 text-center text-white backdrop-blur-sm">
                    <Crown className="mx-auto mb-2 h-7 w-7 text-amber-400" />
                    <p className="text-sm font-semibold">Upgrade to view photos</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="from-primary/20 to-primary/10 text-primary flex h-full w-full items-center justify-center bg-gradient-to-br text-7xl font-bold">
              {getInitials(profile.firstName, profile.lastName)}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-8 text-white">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.trustLevel === "verified_user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <BadgeCheck className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <p className="mb-2 text-xl font-medium">
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

        <CardContent className="from-muted/30 bg-gradient-to-b to-transparent py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSendInterest}
              disabled={isSendingInterest || interestSent}
              size="default"
              className="shadow-premium-sm hover:shadow-premium-md"
            >
              {isSendingInterest ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`mr-2 h-4 w-4 ${interestSent ? "fill-current" : ""}`} />
              )}
              {interestSent ? "Interest Sent" : "Send Interest"}
            </Button>
            <Button variant="outline" asChild size="default">
              <Link href={`/messages?userId=${profile.userId}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-premium-lg">
                <DropdownMenuItem onClick={handleBlock}>
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowReportDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {(profile.email || profile.phoneNumber) && (
          <Card variant="feature" className="border-green-200 bg-green-50 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Phone className="h-5 w-5" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <a href={`mailto:${profile.email}`} className="text-sm hover:underline">
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <a href={`tel:${profile.phoneNumber}`} className="text-sm hover:underline">
                    {profile.phoneNumber}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!profile.email &&
          !profile.phoneNumber &&
          (revealedContact ? (
            <Card variant="feature" className="border-green-200 bg-green-50 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {revealedContact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <a href={`mailto:${revealedContact.email}`} className="text-sm hover:underline">
                      {revealedContact.email}
                    </a>
                  </div>
                )}
                {revealedContact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <a href={`tel:${revealedContact.phone}`} className="text-sm hover:underline">
                      {revealedContact.phone}
                    </a>
                  </div>
                )}
                {!revealedContact.email && !revealedContact.phone && (
                  <p className="text-muted-foreground text-sm">
                    This user has not added any contact information yet.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card
              variant="bordered"
              className="border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/50 md:col-span-2"
            >
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <Crown className="h-7 w-7 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">View Contact Details</p>
                      {!userPlan || userPlan === "free" ? (
                        <p className="text-muted-foreground text-sm">
                          Upgrade to a premium plan to view contact information.
                        </p>
                      ) : isUnlimitedViews ||
                        (contactViewsRemaining !== null && contactViewsRemaining > 0) ? (
                        <p className="text-muted-foreground text-sm">
                          Use 1 contact view to reveal phone &amp; email.
                          {isUnlimitedViews
                            ? " You have unlimited views."
                            : ` ${contactViewsRemaining} view${contactViewsRemaining === 1 ? "" : "s"} remaining.`}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          You have no contact views remaining. Buy a contact pack to continue.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!userPlan || userPlan === "free" ? (
                      <Button
                        size="default"
                        asChild
                        className="shadow-premium-sm hover:shadow-premium-md"
                      >
                        <Link href="/membership">Upgrade</Link>
                      </Button>
                    ) : isUnlimitedViews ||
                      (contactViewsRemaining !== null && contactViewsRemaining > 0) ? (
                      <Button
                        size="default"
                        onClick={handleRevealContact}
                        disabled={isRevealingContact}
                        className="shadow-premium-sm hover:shadow-premium-md"
                      >
                        {isRevealingContact ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="mr-2 h-4 w-4" />
                        )}
                        {isRevealingContact ? "Revealing..." : "View Contact"}
                      </Button>
                    ) : (
                      <Button
                        size="default"
                        asChild
                        className="shadow-premium-sm hover:shadow-premium-md"
                      >
                        <Link href="/contact-packs">Buy Contact Packs</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {profile.aboutMe && (
          <Card variant="elevated" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
                {profile.aboutMe}
              </p>
            </CardContent>
          </Card>
        )}

        {profile.images && profile.images.length > 0 && (
          <Card variant="elevated" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`grid gap-3 ${
                  profile.images.length === 1
                    ? "grid-cols-1"
                    : profile.images.length === 2
                      ? "grid-cols-2"
                      : profile.images.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 md:grid-cols-4"
                }`}
              >
                {profile.images.map((img) => {
                  const lightboxIdx = allImages.findIndex((ai) => ai.imageUrl === img.imageUrl);
                  return (
                    <div
                      key={img.id}
                      className={`bg-muted relative overflow-hidden rounded-xl ${
                        profile.images!.length === 1 ? "aspect-[4/3]" : "aspect-square"
                      } ${profile.canViewPhoto ? "cursor-pointer" : ""}`}
                      onClick={() =>
                        profile.canViewPhoto && lightboxIdx >= 0 && openLightbox(lightboxIdx)
                      }
                    >
                      <Image
                        src={img.imageUrl}
                        alt="Gallery photo"
                        fill
                        className={`object-cover transition-all duration-300 hover:scale-105 ${
                          !profile.canViewPhoto ? "scale-110 blur-lg" : ""
                        }`}
                      />
                      {!profile.canViewPhoto && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-xl bg-black/40 p-2 text-center text-xs font-medium text-white backdrop-blur-sm">
                            <Crown className="mx-auto mb-1 h-4 w-4 text-amber-400" />
                            Locked
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Age" value={`${profile.age} years`} />
            {profile.height && (
              <DetailRow label="Height" value={heightToFeetInches(profile.height)} />
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

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <MapPin className="text-primary h-5 w-5" />
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
            {profile.caste && <DetailRow label="Caste" value={profile.caste} />}
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

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <GraduationCap className="text-primary h-5 w-5" />
              </div>
              Education & Career
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.highestEducation && (
              <DetailRow label="Education" value={profile.highestEducation.replace(/_/g, " ")} />
            )}
            {profile.occupation && (
              <DetailRow label="Occupation" value={profile.occupation.replace(/_/g, " ")} />
            )}
            {profile.annualIncome && (
              <DetailRow label="Annual Income" value={profile.annualIncome.replace(/_/g, " ")} />
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Briefcase className="text-primary h-5 w-5" />
              </div>
              Profile Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Profile Completion" value={`${profile.profileCompletion}%`} />
            {profile.trustLevel && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Trust Level</span>
                <Badge variant={profile.trustLevel === "verified_user" ? "default" : "secondary"}>
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
              {isSubmittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-white/70">
              {lightboxIndex + 1} / {allImages.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:text-white/30"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="w-14 text-center text-sm font-medium text-white/70">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:text-white/30"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={closeLightbox}
                className="ml-2 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={() => {
              if (zoomLevel > 1) handleResetZoom();
              else handleZoomIn();
            }}
            style={{ cursor: zoomLevel > 1 ? "grab" : "zoom-in", touchAction: "none" }}
          >
            <div
              className="relative h-full w-full transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              }}
            >
              <Image
                src={allImages[lightboxIndex].imageUrl}
                alt={`Photo ${lightboxIndex + 1}`}
                fill
                className="pointer-events-none object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:left-4 sm:p-3"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:right-4 sm:p-3"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>
            </>
          )}

          {allImages.length > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-2 overflow-x-auto px-4 py-3">
              {allImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-14 sm:w-14 ${
                    idx === lightboxIndex
                      ? "border-white opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img.imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
