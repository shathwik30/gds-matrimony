"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPartnerPreferences, updatePartnerPreferences } from "@/lib/actions/profile";
import {
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  RELIGION_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "@/constants";

export default function PreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PreferencesContent />
    </Suspense>
  );
}

function PreferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [heightMin, setHeightMin] = useState("");
  const [heightMax, setHeightMax] = useState("");
  const [religions, setReligions] = useState<string[]>([]);
  const [educations, setEducations] = useState<string[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>([]);
  const [aboutPartner, setAboutPartner] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await getPartnerPreferences();
      if (result.success && result.data) {
        const prefs = result.data;
        setAgeMin(prefs.ageMin?.toString() || "");
        setAgeMax(prefs.ageMax?.toString() || "");
        setHeightMin(prefs.heightMin?.toString() || "");
        setHeightMax(prefs.heightMax?.toString() || "");
        setReligions(prefs.religions || []);
        setEducations(prefs.educations || []);
        setMaritalStatuses(prefs.maritalStatuses || []);
        setAboutPartner(prefs.aboutPartner || "");
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updatePartnerPreferences({
        ageMin: ageMin ? parseInt(ageMin) : 18,
        ageMax: ageMax ? parseInt(ageMax) : 70,
        heightMin: heightMin ? parseInt(heightMin) : undefined,
        heightMax: heightMax ? parseInt(heightMax) : undefined,
        religions: religions.length > 0 ? religions : undefined,
        educations: educations.length > 0 ? educations : undefined,
        maritalStatuses: maritalStatuses.length > 0 ? maritalStatuses : undefined,
        aboutPartner: aboutPartner || undefined,
      });

      if (result.success) {
        if (isOnboarding) {
          toast.success("Profile setup completed! Welcome to GDS Marriage Links! 🎉");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          toast.success("Partner preferences updated successfully!");
        }
      } else {
        toast.error(result.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Save preferences error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {isOnboarding && (
        <div className="bg-brand/10 border-brand/20 mb-6 rounded-lg border p-4">
          <h2 className="text-brand mb-1 text-lg font-semibold">Almost Done! 🎯</h2>
          <p className="text-muted-foreground text-sm">
            Tell us about your ideal partner to get better match recommendations.
          </p>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isOnboarding ? "Find Your Perfect Match" : "Partner Preferences"}
        </h1>
        <p className="text-muted-foreground">
          {isOnboarding
            ? "Set your preferences to help us find the best matches for you"
            : "Set your preferences to find your perfect match"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>What are you looking for?</CardTitle>
            <CardDescription>
              Tell us about your ideal partner. These preferences will help us find better matches
              for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Age Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select value={ageMin} onValueChange={setAgeMin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min Age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((age) => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={ageMax} onValueChange={setAgeMax}>
                    <SelectTrigger>
                      <SelectValue placeholder="Max Age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((age) => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Height Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select value={heightMin} onValueChange={setHeightMin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min Height" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEIGHT_OPTIONS.map((height) => (
                        <SelectItem key={height.value} value={height.value.toString()}>
                          {height.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={heightMax} onValueChange={setHeightMax}>
                    <SelectTrigger>
                      <SelectValue placeholder="Max Height" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEIGHT_OPTIONS.map((height) => (
                        <SelectItem key={height.value} value={height.value.toString()}>
                          {height.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Religion (Optional)</Label>
              <Select
                value={religions[0] || "any"}
                onValueChange={(value) => setReligions(value === "any" ? [] : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {RELIGION_OPTIONS.map((religion) => (
                    <SelectItem key={religion} value={religion}>
                      {religion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Education (Optional)</Label>
              <Select
                value={educations[0] || "any"}
                onValueChange={(value) => setEducations(value === "any" ? [] : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {EDUCATION_OPTIONS.map((edu) => (
                    <SelectItem key={edu} value={edu}>
                      {edu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marital Status (Optional)</Label>
              <Select
                value={maritalStatuses[0] || "any"}
                onValueChange={(value) => setMaritalStatuses(value === "any" ? [] : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {MARITAL_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>About Your Ideal Partner (Optional)</Label>
              <Textarea
                placeholder="Describe your ideal partner..."
                value={aboutPartner}
                onChange={(e) => setAboutPartner(e.target.value)}
                rows={4}
              />
              <p className="text-muted-foreground text-xs">
                Share what qualities and values you&apos;re looking for in a life partner
              </p>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isOnboarding ? "Completing Setup..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isOnboarding ? "Complete Setup & Start Matching" : "Save Preferences"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
