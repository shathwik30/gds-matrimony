"use client";

import Link from "next/link";
import Image from "next/image";
import { User, MapPin, GraduationCap, Heart, Ruler, BookOpen, Briefcase, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SharedProfileData } from "@/lib/actions/profile";
import { heightToFeetInches } from "@/lib/utils";

function capitalize(val: string | null | undefined): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function calculateAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age}`;
}

interface SharedProfileViewProps {
  profile: SharedProfileData;
}

export function SharedProfileView({ profile }: SharedProfileViewProps) {
  const firstName = profile.firstName || "Member";
  const age = calculateAge(profile.dateOfBirth);
  const location = [profile.residingCity, profile.residingState].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Profile Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        {/* Blurred Image Section */}
        <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-80">
          {profile.profileImage ? (
            <>
              <Image
                src={profile.profileImage}
                alt=""
                fill
                className="object-cover blur-xl brightness-75"
                sizes="(max-width: 672px) 100vw, 672px"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-medium text-white/90">Photo visible after login</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 sm:p-8">
          {/* Name & Basics */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {firstName}, {age !== "—" ? age : ""}
            </h1>
            {location && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-slate-500">
                <MapPin className="h-4 w-4" />
                {location}
                {profile.countryLivingIn ? `, ${capitalize(profile.countryLivingIn)}` : ""}
              </p>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              icon={<User className="h-5 w-5 text-rose-500" />}
              label="Gender"
              value={capitalize(profile.gender)}
            />
            <InfoCard
              icon={<Heart className="h-5 w-5 text-pink-500" />}
              label="Marital Status"
              value={capitalize(profile.maritalStatus)}
            />
            <InfoCard
              icon={<Ruler className="h-5 w-5 text-blue-500" />}
              label="Height"
              value={profile.height ? heightToFeetInches(profile.height) : "—"}
            />
            <InfoCard
              icon={<BookOpen className="h-5 w-5 text-amber-500" />}
              label="Religion"
              value={
                capitalize(profile.religion) +
                (profile.caste ? ` — ${capitalize(profile.caste)}` : "")
              }
            />
            <InfoCard
              icon={<GraduationCap className="h-5 w-5 text-emerald-500" />}
              label="Education"
              value={capitalize(profile.highestEducation)}
            />
            <InfoCard
              icon={<Briefcase className="h-5 w-5 text-indigo-500" />}
              label="Occupation"
              value={capitalize(profile.occupation)}
            />
          </div>

          {/* Blurred / Locked Section */}
          <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-3 blur-sm select-none" aria-hidden="true">
              <div className="h-4 w-3/4 rounded bg-slate-300" />
              <div className="h-4 w-1/2 rounded bg-slate-300" />
              <div className="h-4 w-2/3 rounded bg-slate-300" />
              <div className="h-4 w-1/3 rounded bg-slate-300" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/60">
              <Lock className="mb-2 h-6 w-6 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Login to view full profile details
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/profile/${profile.id}`)}`}>
                Login to see full profile
              </Link>
            </Button>
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand font-medium hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
