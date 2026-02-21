import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Edit,
  Settings,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  BadgeCheck,
  Heart,
  Users,
  Utensils,
  Camera,
  Star,
  Shield,
  ChevronRight,
} from "lucide-react";
import {
  heightToFeetInches,
  getInitials,
  calculateAge,
  formatIncomeRange,
  getBlurDataURL,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your profile",
};

function cap(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileResult = await getMyProfile();
  const profile = profileResult.data;

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center mx-auto">
            <Camera className="h-12 w-12 text-brand/40" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">No Profile Yet</h1>
            <p className="text-muted-foreground">
              Complete your profile to start finding your perfect match.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 mr-2" />
              Complete Profile
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = getInitials(profile.firstName, profile.lastName);
  const completion = profile.profileCompletion || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryImages: { id: number; imageUrl: string }[] = (profile as any).images ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Completion Banner ──────────────────────────────────────── */}
        {completion < 100 && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">
                    Profile {completion}% complete
                  </p>
                  <span className="text-xs text-amber-600 font-medium">
                    {100 - completion}% remaining
                  </span>
                </div>
                <Progress value={completion} className="h-2 bg-amber-100 [&>div]:bg-amber-500" />
                <p className="text-xs text-amber-700">
                  Complete your profile to get better matches and more visibility.
                </p>
              </div>
              <Button
                size="sm"
                asChild
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                <Link href="/profile/edit">
                  Complete Now
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ── Hero Card ─────────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-border/40 bg-card">
          {/* Cover photo */}
          <div className="relative h-72 sm:h-96 bg-gradient-to-br from-brand/20 via-brand-light to-orange-100">
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={fullName}
                fill
                placeholder="blur"
                blurDataURL={getBlurDataURL(800, 400)}
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-24 h-24 rounded-full bg-white/60 flex items-center justify-center text-brand text-4xl font-bold shadow-inner">
                  {initials}
                </div>
                <p className="text-brand/60 text-sm font-medium">No photo yet</p>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Edit button — top right */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="bg-white/90 hover:bg-white text-foreground shadow-md backdrop-blur-sm"
              >
                <Link href="/profile/edit">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="bg-white/90 hover:bg-white text-foreground shadow-md backdrop-blur-sm"
              >
                <Link href="/settings">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {/* Profile completion badge — top left */}
            {completion >= 100 && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                  <Star className="h-3 w-3 fill-white" />
                  Profile Complete
                </div>
              </div>
            )}

            {/* Name & info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-none">
                      {fullName}
                    </h1>
                    {profile.trustLevel === "verified_user" && (
                      <div className="flex items-center gap-1 bg-blue-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                    {profile.trustLevel === "highly_trusted" && (
                      <div className="flex items-center gap-1 bg-green-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        <Shield className="h-3.5 w-3.5" />
                        Highly Trusted
                      </div>
                    )}
                  </div>
                  <p className="text-white/80 text-lg font-medium">
                    {age ? `${age} years` : ""}
                    {profile.height
                      ? `${age ? " · " : ""}${heightToFeetInches(profile.height)}`
                      : ""}
                  </p>
                  {profile.residingCity && (
                    <p className="flex items-center gap-1.5 text-white/70 text-sm">
                      <MapPin className="h-4 w-4" />
                      {profile.residingCity}
                      {profile.residingState ? `, ${profile.residingState}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick highlights strip */}
          <div className="px-6 py-4 flex flex-wrap gap-2 border-b bg-muted/20">
            {profile.religion && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {cap(profile.religion)}
              </Badge>
            )}
            {profile.caste && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {profile.caste}
              </Badge>
            )}
            {profile.motherTongue && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {cap(profile.motherTongue)}
              </Badge>
            )}
            {profile.highestEducation && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                <GraduationCap className="h-3 w-3 mr-1" />
                {cap(profile.highestEducation)}
              </Badge>
            )}
            {profile.occupation && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                <Briefcase className="h-3 w-3 mr-1" />
                {cap(profile.occupation)}
              </Badge>
            )}
            {profile.maritalStatus && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {cap(profile.maritalStatus)}
              </Badge>
            )}
            {profile.diet && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {cap(profile.diet)}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 flex gap-3 flex-wrap">
            <Button asChild className="shadow-sm">
              <Link href="/profile/edit">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile/preferences">
                <Heart className="h-4 w-4 mr-2" />
                Partner Preferences
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Photo Gallery ─────────────────────────────────────────── */}
        {galleryImages.length > 0 && (
          <section className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Photo Gallery</h2>
                  <p className="text-xs text-muted-foreground">
                    {galleryImages.length} photo{galleryImages.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile/edit?step=8">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Manage
                </Link>
              </Button>
            </div>

            <div className="p-4">
              {galleryImages.length === 1 ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden max-w-sm">
                  <Image
                    src={galleryImages[0].imageUrl}
                    alt="Gallery photo 1"
                    fill
                    placeholder="blur"
                    blurDataURL={getBlurDataURL(400, 300)}
                    className="object-cover"
                  />
                </div>
              ) : galleryImages.length === 2 ? (
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((img, i) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                      <Image
                        src={img.imageUrl}
                        alt={`Gallery photo ${i + 1}`}
                        fill
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(300, 400)}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : galleryImages.length === 3 ? (
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((img, i) => (
                    <div key={img.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                      <Image
                        src={img.imageUrl}
                        alt={`Gallery photo ${i + 1}`}
                        fill
                        placeholder="blur"
                        blurDataURL={getBlurDataURL(300, 400)}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* 4-5 photos: first photo large left, rest in grid right */
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <Image
                      src={galleryImages[0].imageUrl}
                      alt="Gallery photo 1"
                      fill
                      placeholder="blur"
                      blurDataURL={getBlurDataURL(400, 533)}
                      className="object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {galleryImages.slice(1, 5).map((img, i) => (
                      <div
                        key={img.id}
                        className="relative rounded-xl overflow-hidden"
                        style={{ aspectRatio: "1" }}
                      >
                        <Image
                          src={img.imageUrl}
                          alt={`Gallery photo ${i + 2}`}
                          fill
                          placeholder="blur"
                          blurDataURL={getBlurDataURL(200, 200)}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── About Me ──────────────────────────────────────────────── */}
        {profile.aboutMe && (
          <section className="rounded-3xl border border-border/40 bg-card shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-base">About Me</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.aboutMe}
            </p>
          </section>
        )}

        {/* ── Detail Cards Grid ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Basic Details */}
          <DetailCard
            icon={<Calendar className="h-4 w-4 text-primary" />}
            title="Basic Details"
          >
            {age && <Row label="Age" value={`${age} years`} />}
            {profile.dateOfBirth && (
              <Row
                label="Date of Birth"
                value={new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
            {profile.height && (
              <Row label="Height" value={heightToFeetInches(profile.height)} />
            )}
            {profile.weight && <Row label="Weight" value={`${profile.weight} kg`} />}
            {profile.gender && <Row label="Gender" value={cap(profile.gender)} />}
            {profile.maritalStatus && (
              <Row label="Marital Status" value={cap(profile.maritalStatus)} />
            )}
            {profile.bodyType && <Row label="Body Type" value={cap(profile.bodyType)} />}
            {profile.complexion && <Row label="Complexion" value={cap(profile.complexion)} />}
            {profile.physicalStatus && (
              <Row label="Physical Status" value={cap(profile.physicalStatus)} />
            )}
          </DetailCard>

          {/* Religion & Location */}
          <DetailCard
            icon={<MapPin className="h-4 w-4 text-primary" />}
            title="Religion & Location"
          >
            {profile.religion && <Row label="Religion" value={cap(profile.religion)} />}
            {profile.caste && <Row label="Caste" value={profile.caste} />}
            {profile.subCaste && <Row label="Sub Caste" value={profile.subCaste} />}
            {profile.motherTongue && (
              <Row label="Mother Tongue" value={cap(profile.motherTongue)} />
            )}
            {profile.gothra && <Row label="Gothra" value={profile.gothra} />}
            {profile.residingCity && (
              <Row
                label="Location"
                value={`${profile.residingCity}${profile.residingState ? `, ${profile.residingState}` : ""}`}
              />
            )}
            {profile.countryLivingIn && (
              <Row label="Country" value={profile.countryLivingIn} />
            )}
            {profile.citizenship && <Row label="Citizenship" value={profile.citizenship} />}
          </DetailCard>

          {/* Education & Career */}
          <DetailCard
            icon={<GraduationCap className="h-4 w-4 text-primary" />}
            title="Education & Career"
          >
            {profile.highestEducation && (
              <Row label="Education" value={cap(profile.highestEducation)} />
            )}
            {profile.educationDetail && (
              <Row label="College / Field" value={profile.educationDetail} />
            )}
            {profile.employedIn && (
              <Row label="Employed In" value={cap(profile.employedIn)} />
            )}
            {profile.occupation && <Row label="Occupation" value={cap(profile.occupation)} />}
            {profile.jobTitle && <Row label="Job Title" value={profile.jobTitle} />}
            {profile.annualIncome && (
              <Row label="Annual Income" value={formatIncomeRange(profile.annualIncome)} />
            )}
          </DetailCard>

          {/* Lifestyle */}
          <DetailCard
            icon={<Utensils className="h-4 w-4 text-primary" />}
            title="Lifestyle"
          >
            {profile.diet && <Row label="Diet" value={cap(profile.diet)} />}
            {profile.smoking && <Row label="Smoking" value={cap(profile.smoking)} />}
            {profile.drinking && <Row label="Drinking" value={cap(profile.drinking)} />}
            {profile.hobbies && <Row label="Hobbies" value={profile.hobbies} />}
          </DetailCard>

          {/* Family Details */}
          <DetailCard
            icon={<Users className="h-4 w-4 text-primary" />}
            title="Family Details"
          >
            {profile.familyStatus && (
              <Row label="Family Status" value={cap(profile.familyStatus)} />
            )}
            {profile.familyType && (
              <Row label="Family Type" value={cap(profile.familyType)} />
            )}
            {profile.familyValue && (
              <Row label="Family Values" value={cap(profile.familyValue)} />
            )}
            {profile.fatherOccupation && (
              <Row label="Father's Occupation" value={cap(profile.fatherOccupation)} />
            )}
            {profile.motherOccupation && (
              <Row label="Mother's Occupation" value={cap(profile.motherOccupation)} />
            )}
            {profile.brothers != null && (
              <Row
                label="Brothers"
                value={`${profile.brothers}${profile.brothersMarried ? ` (${profile.brothersMarried} married)` : ""}`}
              />
            )}
            {profile.sisters != null && (
              <Row
                label="Sisters"
                value={`${profile.sisters}${profile.sistersMarried ? ` (${profile.sistersMarried} married)` : ""}`}
              />
            )}
          </DetailCard>

          {/* Profile Status */}
          <DetailCard
            icon={<Briefcase className="h-4 w-4 text-primary" />}
            title="Profile Status"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion</span>
                <div className="flex items-center gap-2">
                  <Progress value={completion} className="w-20 h-1.5" />
                  <span className="text-sm font-semibold">{completion}%</span>
                </div>
              </div>
              {profile.trustLevel && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trust Level</span>
                  <Badge
                    variant={
                      profile.trustLevel === "highly_trusted"
                        ? "default"
                        : profile.trustLevel === "verified_user"
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {cap(profile.trustLevel)}
                  </Badge>
                </div>
              )}
              <Row label="Trust Score" value={`${profile.trustScore || 0} / 100`} />
            </div>
          </DetailCard>
        </div>

      </div>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/20">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
