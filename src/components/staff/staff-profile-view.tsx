import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DetailRow } from "@/components/profile/detail-row";
import {
  getInitials,
  getFullName,
  heightToFeetInches,
  formatIncomeRange,
  formatDate,
} from "@/lib/utils";
import { capitalCase } from "change-case";

interface StaffProfileViewProps {
  user: {
    id: number;
    email: string;
    phoneNumber: string | null;
    secondaryPhoneNumber: string | null;
    profileFor: string | null;
    createdAt: Date | null;
  };
  profile: {
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    height: number | null;
    weight: number | null;
    bodyType: string | null;
    complexion: string | null;
    physicalStatus: string | null;
    religion: string | null;
    caste: string | null;
    subCaste: string | null;
    motherTongue: string | null;
    gothra: string | null;
    countryLivingIn: string | null;
    residingState: string | null;
    residingCity: string | null;
    citizenship: string | null;
    highestEducation: string | null;
    educationDetail: string | null;
    employedIn: string | null;
    occupation: string | null;
    jobTitle: string | null;
    annualIncome: string | null;
    maritalStatus: string | null;
    diet: string | null;
    smoking: string | null;
    drinking: string | null;
    hobbies: string | null;
    familyStatus: string | null;
    familyType: string | null;
    familyValue: string | null;
    fatherOccupation: string | null;
    motherOccupation: string | null;
    brothers: number | null;
    brothersMarried: number | null;
    sisters: number | null;
    sistersMarried: number | null;
    aboutMe: string | null;
    profileImage: string | null;
    profileCompletion: number | null;
  };
  images: { id: number; imageUrl: string; sortOrder: number | null }[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function StaffProfileView({ user, profile, images }: StaffProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.profileImage || undefined} />
          <AvatarFallback className="bg-brand/10 text-brand text-2xl">
            {getInitials(profile.firstName, profile.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {getFullName(profile.firstName, profile.lastName)}
          </h2>
          <p className="text-slate-500">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-slate-500">Profile Completion:</span>
            <span className="text-sm font-medium">{profile.profileCompletion || 0}%</span>
          </div>
          {user.createdAt && (
            <p className="mt-1 text-sm text-slate-500">Created on {formatDate(user.createdAt)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Section title="Account Info">
          <DetailRow label="Email" value={user.email} />
          {user.phoneNumber && <DetailRow label="Phone" value={user.phoneNumber} />}
          {user.secondaryPhoneNumber && (
            <DetailRow label="Secondary Phone" value={user.secondaryPhoneNumber} />
          )}
          {user.profileFor && (
            <DetailRow label="Profile For" value={capitalCase(user.profileFor)} />
          )}
        </Section>

        {/* Basic Info */}
        <Section title="Basic Info">
          {profile.gender && <DetailRow label="Gender" value={capitalCase(profile.gender)} />}
          {profile.dateOfBirth && <DetailRow label="Date of Birth" value={profile.dateOfBirth} />}
          {profile.maritalStatus && (
            <DetailRow label="Marital Status" value={capitalCase(profile.maritalStatus)} />
          )}
        </Section>

        {/* Physical Details */}
        <Section title="Physical Details">
          {profile.height && (
            <DetailRow
              label="Height"
              value={`${profile.height} cm (${heightToFeetInches(profile.height)})`}
            />
          )}
          {profile.weight && <DetailRow label="Weight" value={`${profile.weight} kg`} />}
          {profile.bodyType && <DetailRow label="Body Type" value={profile.bodyType} />}
          {profile.complexion && <DetailRow label="Complexion" value={profile.complexion} />}
          {profile.physicalStatus && (
            <DetailRow label="Physical Status" value={profile.physicalStatus} />
          )}
        </Section>

        {/* Religion & Location */}
        <Section title="Religion & Location">
          {profile.religion && <DetailRow label="Religion" value={profile.religion} />}
          {profile.caste && <DetailRow label="Caste" value={profile.caste} />}
          {profile.subCaste && <DetailRow label="Sub Caste" value={profile.subCaste} />}
          {profile.motherTongue && <DetailRow label="Mother Tongue" value={profile.motherTongue} />}
          {profile.gothra && <DetailRow label="Gothra" value={profile.gothra} />}
          {profile.countryLivingIn && <DetailRow label="Country" value={profile.countryLivingIn} />}
          {profile.residingState && <DetailRow label="State" value={profile.residingState} />}
          {profile.residingCity && <DetailRow label="City" value={profile.residingCity} />}
          {profile.citizenship && <DetailRow label="Citizenship" value={profile.citizenship} />}
        </Section>

        {/* Education & Career */}
        <Section title="Education & Career">
          {profile.highestEducation && (
            <DetailRow label="Education" value={profile.highestEducation} />
          )}
          {profile.educationDetail && (
            <DetailRow label="Education Detail" value={profile.educationDetail} />
          )}
          {profile.employedIn && <DetailRow label="Employed In" value={profile.employedIn} />}
          {profile.occupation && <DetailRow label="Occupation" value={profile.occupation} />}
          {profile.jobTitle && <DetailRow label="Job Title" value={profile.jobTitle} />}
          {profile.annualIncome && (
            <DetailRow label="Annual Income" value={formatIncomeRange(profile.annualIncome)} />
          )}
        </Section>

        {/* Lifestyle */}
        <Section title="Lifestyle">
          {profile.diet && <DetailRow label="Diet" value={profile.diet} />}
          {profile.smoking && <DetailRow label="Smoking" value={profile.smoking} />}
          {profile.drinking && <DetailRow label="Drinking" value={profile.drinking} />}
          {profile.hobbies && <DetailRow label="Hobbies" value={profile.hobbies} />}
        </Section>

        {/* Family Details */}
        <Section title="Family Details">
          {profile.familyStatus && <DetailRow label="Family Status" value={profile.familyStatus} />}
          {profile.familyType && <DetailRow label="Family Type" value={profile.familyType} />}
          {profile.familyValue && <DetailRow label="Family Value" value={profile.familyValue} />}
          {profile.fatherOccupation && (
            <DetailRow label="Father's Occupation" value={profile.fatherOccupation} />
          )}
          {profile.motherOccupation && (
            <DetailRow label="Mother's Occupation" value={profile.motherOccupation} />
          )}
          {profile.brothers != null && (
            <DetailRow
              label="Brothers"
              value={`${profile.brothers} (${profile.brothersMarried || 0} married)`}
            />
          )}
          {profile.sisters != null && (
            <DetailRow
              label="Sisters"
              value={`${profile.sisters} (${profile.sistersMarried || 0} married)`}
            />
          )}
        </Section>
      </div>

      {/* About Me */}
      {profile.aboutMe && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">About Me</h3>
          <p className="whitespace-pre-wrap text-slate-700">{profile.aboutMe}</p>
        </div>
      )}

      {/* Gallery */}
      {images.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Photos</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={img.imageUrl}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
