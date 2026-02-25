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
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md space-y-6 text-center">
          <div className="bg-brand-light mx-auto flex h-24 w-24 items-center justify-center rounded-full">
            <Camera className="text-brand/40 h-12 w-12" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold">No Profile Yet</h1>
            <p className="text-muted-foreground">
              Complete your profile to start finding your perfect match.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" />
              Complete Profile
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = getInitials(profile.firstName, profile.lastName);
  const completion = profile.profileCompletion || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryImages: { id: number; imageUrl: string }[] = (profile as any).images ?? [];

  return (
    <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b">
      <div className="mx-auto max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 md:py-8">
        {completion < 100 && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">
                    Profile {completion}% complete
                  </p>
                  <span className="text-xs font-medium text-amber-600">
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
                className="shrink-0 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
              >
                <Link href="/profile/edit">
                  Complete Now
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="border-border/40 bg-card overflow-hidden rounded-3xl border shadow-xl">
          <div className="from-brand/20 via-brand-light relative h-56 bg-gradient-to-br to-orange-100 sm:h-72 md:h-96">
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
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <div className="text-brand flex h-24 w-24 items-center justify-center rounded-full bg-white/60 text-4xl font-bold shadow-inner">
                  {initials}
                </div>
                <p className="text-brand/60 text-sm font-medium">No photo yet</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="text-foreground bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
              >
                <Link href="/profile/edit">
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="text-foreground bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
              >
                <Link href="/settings">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {completion >= 100 && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                  <Star className="h-3 w-3 fill-white" />
                  Profile Complete
                </div>
              </div>
            )}

            <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6 md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl leading-none font-bold tracking-tight sm:text-3xl md:text-4xl">
                      {fullName}
                    </h1>
                    {profile.trustLevel === "verified_user" && (
                      <div className="flex items-center gap-1 rounded-full bg-blue-500/90 px-2.5 py-1 text-xs font-medium text-white">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                    {profile.trustLevel === "highly_trusted" && (
                      <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-2.5 py-1 text-xs font-medium text-white">
                        <Shield className="h-3.5 w-3.5" />
                        Highly Trusted
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-medium text-white/80">
                    {age ? `${age} years` : ""}
                    {profile.height
                      ? `${age ? " · " : ""}${heightToFeetInches(profile.height)}`
                      : ""}
                  </p>
                  {profile.residingCity && (
                    <p className="flex items-center gap-1.5 text-sm text-white/70">
                      <MapPin className="h-4 w-4" />
                      {profile.residingCity}
                      {profile.residingState ? `, ${profile.residingState}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 flex flex-wrap gap-1.5 border-b px-4 py-3 sm:gap-2 sm:px-6 sm:py-4">
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
                <GraduationCap className="mr-1 h-3 w-3" />
                {cap(profile.highestEducation)}
              </Badge>
            )}
            {profile.occupation && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                <Briefcase className="mr-1 h-3 w-3" />
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

          <div className="flex flex-wrap gap-2 px-3 py-3 sm:px-6 sm:py-4">
            <Button asChild size="sm" className="sm:size-default shadow-sm">
              <Link href="/profile/edit">
                <Edit className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="sm:size-default">
              <Link href="/profile/preferences">
                <Heart className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                Preferences
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="sm:size-default">
              <Link href="/settings">
                <Settings className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {galleryImages.length > 0 && (
          <section className="border-border/40 bg-card overflow-hidden rounded-3xl border shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
                  <Camera className="text-primary h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Photo Gallery</h2>
                  <p className="text-muted-foreground text-xs">
                    {galleryImages.length} photo{galleryImages.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile/edit?step=8">
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Manage
                </Link>
              </Button>
            </div>

            <div className="p-3 sm:p-4">
              {galleryImages.length === 1 ? (
                <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded-2xl">
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
                    <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {galleryImages.map((img, i) => (
                    <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{ aspectRatio: "3/4" }}
                  >
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
                        className="relative overflow-hidden rounded-xl"
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

        {profile.aboutMe && (
          <section className="border-border/40 bg-card rounded-3xl border p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
                <Heart className="text-primary h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">About Me</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.aboutMe}
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <DetailCard icon={<Calendar className="text-primary h-4 w-4" />} title="Basic Details">
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
            {profile.height && <Row label="Height" value={heightToFeetInches(profile.height)} />}
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

          <DetailCard
            icon={<MapPin className="text-primary h-4 w-4" />}
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
            {profile.countryLivingIn && <Row label="Country" value={profile.countryLivingIn} />}
            {profile.citizenship && <Row label="Citizenship" value={profile.citizenship} />}
          </DetailCard>

          <DetailCard
            icon={<GraduationCap className="text-primary h-4 w-4" />}
            title="Education & Career"
          >
            {profile.highestEducation && (
              <Row label="Education" value={cap(profile.highestEducation)} />
            )}
            {profile.educationDetail && (
              <Row label="College / Field" value={profile.educationDetail} />
            )}
            {profile.employedIn && <Row label="Employed In" value={cap(profile.employedIn)} />}
            {profile.occupation && <Row label="Occupation" value={cap(profile.occupation)} />}
            {profile.jobTitle && <Row label="Job Title" value={profile.jobTitle} />}
            {profile.annualIncome && (
              <Row label="Annual Income" value={formatIncomeRange(profile.annualIncome)} />
            )}
          </DetailCard>

          <DetailCard icon={<Utensils className="text-primary h-4 w-4" />} title="Lifestyle">
            {profile.diet && <Row label="Diet" value={cap(profile.diet)} />}
            {profile.smoking && <Row label="Smoking" value={cap(profile.smoking)} />}
            {profile.drinking && <Row label="Drinking" value={cap(profile.drinking)} />}
            {profile.hobbies && <Row label="Hobbies" value={profile.hobbies} />}
          </DetailCard>

          <DetailCard icon={<Users className="text-primary h-4 w-4" />} title="Family Details">
            {profile.familyStatus && (
              <Row label="Family Status" value={cap(profile.familyStatus)} />
            )}
            {profile.familyType && <Row label="Family Type" value={cap(profile.familyType)} />}
            {profile.familyValue && <Row label="Family Values" value={cap(profile.familyValue)} />}
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

          <DetailCard icon={<Briefcase className="text-primary h-4 w-4" />} title="Profile Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Completion</span>
                <div className="flex items-center gap-2">
                  <Progress value={completion} className="h-1.5 w-20" />
                  <span className="text-sm font-semibold">{completion}%</span>
                </div>
              </div>
              {profile.trustLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Trust Level</span>
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
    <div className="border-border/40 bg-card overflow-hidden rounded-3xl border shadow-sm">
      <div className="bg-muted/20 flex items-center gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
          {icon}
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
