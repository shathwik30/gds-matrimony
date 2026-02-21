"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, ChevronRight, Check,
  User, Ruler, MapPin, GraduationCap, Heart, Users, FileText, Camera,
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
  { id: 1, title: "Basic Info",          description: "Name, gender & date of birth",   icon: User },
  { id: 2, title: "Physical Details",    description: "Height, weight & body type",      icon: Ruler },
  { id: 3, title: "Religion & Location", description: "Religion, caste & location",      icon: MapPin },
  { id: 4, title: "Education & Career",  description: "Education & occupation",          icon: GraduationCap },
  { id: 5, title: "Lifestyle",           description: "Marital status & habits",         icon: Heart },
  { id: 6, title: "Family Details",      description: "Family background",               icon: Users },
  { id: 7, title: "About Me",            description: "Describe yourself",               icon: FileText },
  { id: 8, title: "Photos",             description: "Profile & gallery photos",         icon: Camera },
];

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
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

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => { validateCurrentStep.current = null; }, [currentStep]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const step = STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const progress = calculateProfileCompletion(profileData);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Onboarding welcome banner */}
      {isOnboarding && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand/10 via-brand/5 to-transparent border border-brand/20 p-5">
          <h2 className="text-lg font-semibold text-brand mb-1">Welcome to GDS Marriage Links! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            Complete your profile in a few steps to find your perfect match.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
            {isOnboarding ? "Complete Your Profile" : "Edit Your Profile"}
          </p>
          <h1 className="text-2xl font-bold">{step.title}</h1>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-brand">{currentStep}</span>
          <span className="text-lg text-muted-foreground">/{STEPS.length}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{progress}% profile</p>
        </div>
      </div>

      {/* Step Indicator — desktop */}
      <div className="hidden md:block mb-8">
        <div className="flex items-center">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone    = s.id < currentStep;
            const isActive  = s.id === currentStep;
            const isPending = s.id > currentStep;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => !isPending && setCurrentStep(s.id)}
                  title={s.title}
                  className={`
                    relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200 focus:outline-none
                    ${isActive  ? "bg-brand text-white shadow-lg shadow-brand/30 scale-110 ring-4 ring-brand/20" : ""}
                    ${isDone    ? "bg-green-500 text-white cursor-pointer hover:bg-green-600" : ""}
                    ${isPending ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                  `}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  {isActive && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-brand">
                      {s.title}
                    </span>
                  )}
                </button>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-muted">
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
        {/* Spacer for the active label below */}
        <div className="h-7" />
      </div>

      {/* Step Indicator — mobile: dot row */}
      <div className="flex md:hidden items-center gap-1.5 mb-6 justify-center">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`rounded-full transition-all duration-300 ${
              s.id === currentStep
                ? "w-6 h-2 bg-brand"
                : s.id < currentStep
                ? "w-2 h-2 bg-green-500"
                : "w-2 h-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">

        {/* Card header strip */}
        <div className="bg-gradient-to-r from-brand/8 to-transparent border-b px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <StepIcon className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">{step.title}</h2>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
          {/* Mini progress pill */}
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          {currentStep === 1 && <BasicInfoStep       data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 2 && <PhysicalDetailsStep data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 3 && <ReligionLocationStep data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 4 && <EducationCareerStep data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 5 && <LifestyleStep       data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 6 && <FamilyDetailsStep   data={profileData} onUpdate={handleStepData} />}
          {currentStep === 7 && <AboutMeStep         data={profileData} onUpdate={handleStepData} registerValidate={registerValidate} />}
          {currentStep === 8 && <PhotosStep          data={profileData} onUpdate={handleStepData} onImagesChange={loadProfile} />}
        </div>

        {/* Navigation footer */}
        <div className="border-t bg-muted/30 px-6 py-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSaving}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            Previous
          </Button>

          {/* Step dots — shown between buttons on mobile */}
          <div className="flex sm:hidden items-center gap-1">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`rounded-full transition-all ${
                  s.id === currentStep ? "w-4 h-1.5 bg-brand" : s.id < currentStep ? "w-1.5 h-1.5 bg-green-500" : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleSaveStep}
            disabled={isSaving}
            className="rounded-xl bg-brand hover:bg-brand/90 text-white px-6"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {currentStep === STEPS.length ? "Save & Finish" : "Save & Continue"}
            {!isSaving && currentStep < STEPS.length && <ChevronRight className="h-4 w-4 ml-1.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
