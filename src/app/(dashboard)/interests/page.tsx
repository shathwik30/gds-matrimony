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
          {/* Profile Image */}
          <Link
            href={`/profile/${profile.userId}`}
            className="relative w-full sm:w-48 aspect-square sm:aspect-auto shrink-0 overflow-hidden bg-muted block"
          >
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={`${profile.firstName}'s photo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-light text-brand text-3xl font-semibold min-h-[180px]">
                {getInitials(profile.firstName, profile.lastName)}
              </div>
            )}
            {interest.status === "pending" && type === "received" && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-yellow-500 shadow-md">New</Badge>
              </div>
            )}
          </Link>

          {/* Profile Details */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${profile.userId}`}
                  className="text-lg font-semibold hover:text-primary transition-colors"
                >
                  {profile.firstName} {profile.lastName}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5">
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

            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              {(profile.residingCity || profile.residingState) && (
                <p>{[profile.residingCity, profile.residingState].filter(Boolean).join(", ")}</p>
              )}
              {profile.religion && <p>{profile.religion}{profile.caste && `, ${profile.caste}`}</p>}
              {profile.highestEducation && <p>{profile.highestEducation}</p>}
              {profile.occupation && <p>{profile.occupation}</p>}
            </div>

            {/* Action Buttons - pushed to bottom */}
            <div className="mt-auto flex items-center gap-2 flex-wrap">
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
                        <Check className="h-4 w-4 mr-1.5" />
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
                    <X className="h-4 w-4 mr-1.5" />
                    Decline
                  </Button>
                </>
              )}

              {type === "accepted" && (
                <Button size="sm" asChild>
                  <Link href={`/messages?userId=${profile.userId}`}>
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Message
                  </Link>
                </Button>
              )}

              <Button size="sm" variant="ghost" asChild>
                <Link href={`/profile/${profile.userId}`}>View Profile</Link>
              </Button>

              {/* Timestamp */}
              {interest.createdAt && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
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
      description: "Complete your profile and stay active to receive interests from potential matches.",
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
    <div className="text-center py-12">
      <Heart className="h-12 w-12 mx-auto text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{messages[type].title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
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
    setReceived((prev) =>
      prev.map((i) => (i.id === interestId ? { ...i, status } : i))
    );
    if (status === "accepted") {
      const acceptedItem = received.find((i) => i.id === interestId);
      if (acceptedItem) {
        setAccepted((prev) => [{ ...acceptedItem, status: "accepted" }, ...prev]);
      }
    }

    try {
      const result = await respondToInterest(interestId, status);
      if (result.success) {
        toast.success(result.message || (status === "accepted" ? "Interest accepted" : "Interest declined"));
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interests</h1>
        <p className="text-muted-foreground mt-1">
          Manage your sent and received interests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="received" className="relative">
            Received
            {pendingCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
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
            <div className="space-y-4 max-w-4xl">
              {received.map((interest, index) => (
                <div key={interest.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                  <InterestCard
                    interest={interest}
                    type="received"
                    onRespond={handleRespond}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sent.length === 0 ? (
            <EmptyState type="sent" />
          ) : (
            <div className="space-y-4 max-w-4xl">
              {sent.map((interest, index) => (
                <div key={interest.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
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
            <div className="space-y-4 max-w-4xl">
              {accepted.map((interest, index) => (
                <div key={interest.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                  <InterestCard
                    interest={interest}
                    type="accepted"
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
