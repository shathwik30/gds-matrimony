"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Ruler,
  MapPin,
  GraduationCap,
  Heart,
  Users,
  FileText,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateProfileCompletion } from "@/lib/utils";
import { getMyProfile, updateProfile } from "@/lib/actions/profile";
import { BasicInfoStep } from "@/components/profile/basic-info-step";
import { PhysicalDetailsStep } from "@/components/profile/physical-details-step";
import { ReligionLocationStep } from "@/components/profile/religion-location-step";
import { EducationCareerStep } from "@/components/profile/education-career-step";
import { LifestyleStep } from "@/components/profile/lifestyle-step";
import { FamilyDetailsStep } from "@/components/profile/family-details-step";
import { AboutMeStep } from "@/components/profile/about-me-step";
import { PhotosStep } from "@/components/profile/photos-step";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Name, gender & date of birth", icon: User },
  { id: 2, title: "Physical Details", description: "Height, weight & body type", icon: Ruler },
  { id: 3, title: "Religion & Location", description: "Religion, caste & location", icon: MapPin },
  {
    id: 4,
    title: "Education & Career",
    description: "Education & occupation",
    icon: GraduationCap,
  },
  { id: 5, title: "Lifestyle", description: "Marital status & habits", icon: Heart },
  { id: 6, title: "Family Details", description: "Family background", icon: Users },
  { id: 7, title: "About Me", description: "Describe yourself", icon: FileText },
  { id: 8, title: "Photos", description: "Profile & gallery photos", icon: Camera },
];

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const validateCurrentStep = useRef<(() => Promise<boolean>) | null>(null);

  const registerValidate = useCallback((fn: () => Promise<boolean>) => {
    validateCurrentStep.current = fn;
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    validateCurrentStep.current = null;
  }, [currentStep]);

  const loadProfile = async () => {
    try {
      const result = await getMyProfile();
      if (result.success && result.data) {
        const data: Record<string, unknown> = { ...result.data };
        if (data.dateOfBirth && typeof data.dateOfBirth === "string") {
          data.dateOfBirth = new Date(data.dateOfBirth);
        }
        setProfileData(data);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepData = (data: Record<string, unknown>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const handleSaveStep = async () => {
    if (validateCurrentStep.current) {
      const isValid = await validateCurrentStep.current();
      if (!isValid) {
        toast.error("Please fill in all required fields before continuing");
        return;
      }
    }
    setIsSaving(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success("Profile saved successfully");
        if (currentStep < STEPS.length) {
          setCurrentStep((prev) => prev + 1);
        } else {
          router.push(isOnboarding ? "/profile/preferences?onboarding=true" : "/dashboard");
        }
      } else {
        toast.error(result.error || "Failed to save profile");
      }
    } catch {
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

  const step = STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const progress = calculateProfileCompletion(profileData);

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 md:py-8">
      {isOnboarding && (
        <div className="from-brand/10 via-brand/5 border-brand/20 mb-6 rounded-2xl border bg-gradient-to-r to-transparent p-5">
          <h2 className="text-brand mb-1 text-lg font-semibold">
            Welcome to GDS Marriage Links! 🎉
          </h2>
          <p className="text-muted-foreground text-sm">
            Complete your profile in a few steps to find your perfect match.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-widest uppercase">
            {isOnboarding ? "Complete Your Profile" : "Edit Your Profile"}
          </p>
          <h1 className="text-2xl font-bold">{step.title}</h1>
        </div>
        <div className="text-right">
          <span className="text-brand text-2xl font-bold">{currentStep}</span>
          <span className="text-muted-foreground text-lg">/{STEPS.length}</span>
          <p className="text-muted-foreground mt-0.5 text-xs">{progress}% profile</p>
        </div>
      </div>

      <div className="mb-8 hidden md:block">
        <div className="flex items-center">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = s.id < currentStep;
            const isActive = s.id === currentStep;
            const isPending = s.id > currentStep;
            return (
              <div key={s.id} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => !isPending && setCurrentStep(s.id)}
                  title={s.title}
                  className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 focus:outline-none ${isActive ? "bg-brand shadow-brand/30 ring-brand/20 scale-110 text-white shadow-lg ring-4" : ""} ${isDone ? "cursor-pointer bg-green-500 text-white hover:bg-green-600" : ""} ${isPending ? "bg-muted text-muted-foreground cursor-not-allowed" : ""} `}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  {isActive && (
                    <span className="text-brand absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap">
                      {s.title}
                    </span>
                  )}
                </button>

                {idx < STEPS.length - 1 && (
                  <div className="bg-muted mx-1 h-0.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: isDone ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-7" />
      </div>

      <div className="mb-6 flex items-center justify-center gap-1.5 md:hidden">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`rounded-full transition-all duration-300 ${
              s.id === currentStep
                ? "bg-brand h-2 w-6"
                : s.id < currentStep
                  ? "h-2 w-2 bg-green-500"
                  : "bg-muted h-2 w-2"
            }`}
          />
        ))}
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="from-brand/8 flex items-center gap-3 border-b bg-gradient-to-r to-transparent px-4 py-3 sm:px-6 sm:py-4">
          <div className="bg-brand/10 flex h-9 w-9 items-center justify-center rounded-xl">
            <StepIcon className="text-brand h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base leading-tight font-semibold">{step.title}</h2>
            <p className="text-muted-foreground text-xs">{step.description}</p>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <div className="bg-muted h-1.5 w-32 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs font-medium">{progress}%</span>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {currentStep === 1 && (
            <BasicInfoStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 2 && (
            <PhysicalDetailsStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 3 && (
            <ReligionLocationStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 4 && (
            <EducationCareerStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 5 && (
            <LifestyleStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 6 && <FamilyDetailsStep data={profileData} onUpdate={handleStepData} />}
          {currentStep === 7 && (
            <AboutMeStep
              data={profileData}
              onUpdate={handleStepData}
              registerValidate={registerValidate}
            />
          )}
          {currentStep === 8 && (
            <PhotosStep data={profileData} onUpdate={handleStepData} onImagesChange={loadProfile} />
          )}
        </div>

        <div className="bg-muted/30 flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSaving}
            className="rounded-xl"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1 sm:hidden">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`rounded-full transition-all ${
                  s.id === currentStep
                    ? "bg-brand h-1.5 w-4"
                    : s.id < currentStep
                      ? "h-1.5 w-1.5 bg-green-500"
                      : "bg-muted-foreground/30 h-1.5 w-1.5"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleSaveStep}
            disabled={isSaving}
            className="bg-brand hover:bg-brand/90 rounded-xl px-6 text-white"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {currentStep === STEPS.length ? "Save & Finish" : "Save & Continue"}
            {!isSaving && currentStep < STEPS.length && <ChevronRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
