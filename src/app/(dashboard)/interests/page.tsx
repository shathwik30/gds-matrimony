"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Heart, Check, X, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getReceivedInterests,
  getSentInterests,
  getAcceptedInterests,
  respondToInterest,
} from "@/lib/actions/interests";
import type { InterestWithProfile } from "@/types";
import { heightToFeetInches, getInitials } from "@/lib/utils";

function InterestCard({
  interest,
  type,
  onRespond,
}: {
  interest: InterestWithProfile;
  type: "received" | "sent" | "accepted";
  onRespond?: (id: number, status: "accepted" | "rejected") => void;
}) {
  const { profile } = interest;
  const [isResponding, setIsResponding] = useState(false);

  const handleRespond = async (status: "accepted" | "rejected") => {
    setIsResponding(true);
    try {
      if (onRespond) {
        await onRespond(interest.id, status);
      }
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <Link
            href={`/profile/${profile.userId}`}
            className="bg-muted relative block aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-40 md:w-48"
          >
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={`${profile.firstName}'s photo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="bg-brand-light text-brand flex h-full min-h-[180px] w-full items-center justify-center text-3xl font-semibold">
                {getInitials(profile.firstName, profile.lastName)}
              </div>
            )}
            {interest.status === "pending" && type === "received" && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-yellow-500 shadow-md">New</Badge>
              </div>
            )}
          </Link>

          <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${profile.userId}`}
                  className="hover:text-primary text-lg font-semibold transition-colors"
                >
                  {profile.firstName} {profile.lastName}
                </Link>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {profile.age} yrs{profile.height && `, ${heightToFeetInches(profile.height)}`}
                </p>
              </div>
              <div className="shrink-0">
                {(type === "sent" || (type === "received" && interest.status !== "pending")) && (
                  <Badge
                    variant={
                      interest.status === "accepted"
                        ? "default"
                        : interest.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {interest.status === "accepted"
                      ? "Accepted"
                      : interest.status === "rejected"
                        ? "Declined"
                        : "Pending"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-muted-foreground mb-4 space-y-1 text-sm">
              {(profile.residingCity || profile.residingState) && (
                <p>{[profile.residingCity, profile.residingState].filter(Boolean).join(", ")}</p>
              )}
              {profile.religion && (
                <p>
                  {profile.religion}
                  {profile.caste && `, ${profile.caste}`}
                </p>
              )}
              {profile.highestEducation && <p>{profile.highestEducation}</p>}
              {profile.occupation && <p>{profile.occupation}</p>}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
              {type === "received" && interest.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleRespond("accepted")}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond("rejected")}
                    disabled={isResponding}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}

              {type === "accepted" && (
                <Button size="sm" asChild>
                  <Link href={`/messages?userId=${profile.userId}`}>
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Message
                  </Link>
                </Button>
              )}

              <Button size="sm" variant="ghost" asChild>
                <Link href={`/profile/${profile.userId}`}>View Profile</Link>
              </Button>

              {interest.createdAt && (
                <span className="text-muted-foreground ml-auto flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {new Date(interest.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: "received" | "sent" | "accepted" }) {
  const messages = {
    received: {
      title: "No interests received yet",
      description:
        "Complete your profile and stay active to receive interests from potential matches.",
    },
    sent: {
      title: "No interests sent yet",
      description: "Browse profiles and send interests to people you'd like to connect with.",
    },
    accepted: {
      title: "No mutual connections yet",
      description: "When someone accepts your interest or you accept theirs, they'll appear here.",
    },
  };

  return (
    <div className="py-12 text-center">
      <Heart className="text-muted-foreground/50 mx-auto h-12 w-12" />
      <h3 className="mt-4 text-lg font-semibold">{messages[type].title}</h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        {messages[type].description}
      </p>
      {type !== "accepted" && (
        <Button className="mt-4" asChild>
          <Link href="/matches">Browse Matches</Link>
        </Button>
      )}
    </div>
  );
}

export default function InterestsPage() {
  const [activeTab, setActiveTab] = useState("received");
  const [isLoading, setIsLoading] = useState(true);
  const [received, setReceived] = useState<InterestWithProfile[]>([]);
  const [sent, setSent] = useState<InterestWithProfile[]>([]);
  const [accepted, setAccepted] = useState<InterestWithProfile[]>([]);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    setIsLoading(true);
    try {
      const [receivedResult, sentResult, acceptedResult] = await Promise.all([
        getReceivedInterests(),
        getSentInterests(),
        getAcceptedInterests(),
      ]);

      if (receivedResult.success && receivedResult.data) {
        setReceived(receivedResult.data);
      }
      if (sentResult.success && sentResult.data) {
        setSent(sentResult.data);
      }
      if (acceptedResult.success && acceptedResult.data) {
        setAccepted(acceptedResult.data);
      }
    } catch (error) {
      console.error("Failed to load interests:", error);
      toast.error("Failed to load interests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (interestId: number, status: "accepted" | "rejected") => {
    // Optimistic update - immediately update the UI
    setReceived((prev) => prev.map((i) => (i.id === interestId ? { ...i, status } : i)));
    if (status === "accepted") {
      const acceptedItem = received.find((i) => i.id === interestId);
      if (acceptedItem) {
        setAccepted((prev) => [{ ...acceptedItem, status: "accepted" }, ...prev]);
      }
    }

    try {
      const result = await respondToInterest(interestId, status);
      if (result.success) {
        toast.success(
          result.message || (status === "accepted" ? "Interest accepted" : "Interest declined")
        );
      } else {
        // Revert optimistic update on failure
        toast.error(result.error || "Failed to respond");
        loadInterests();
      }
    } catch {
      toast.error("Something went wrong");
      loadInterests();
    }
  };

  const pendingCount = received.filter((i) => i.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Interests</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your sent and received interests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-3 sm:mb-6 sm:max-w-md">
          <TabsTrigger value="received" className="relative">
            Received
            {pendingCount > 0 && (
              <Badge className="ml-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {received.length === 0 ? (
            <EmptyState type="received" />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {received.map((interest, index) => (
                <div
                  key={interest.id}
                  className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                >
                  <InterestCard interest={interest} type="received" onRespond={handleRespond} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sent.length === 0 ? (
            <EmptyState type="sent" />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sent.map((interest, index) => (
                <div
                  key={interest.id}
                  className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                >
                  <InterestCard interest={interest} type="sent" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted">
          {accepted.length === 0 ? (
            <EmptyState type="accepted" />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {accepted.map((interest, index) => (
                <div
                  key={interest.id}
                  className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                >
                  <InterestCard interest={interest} type="accepted" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
