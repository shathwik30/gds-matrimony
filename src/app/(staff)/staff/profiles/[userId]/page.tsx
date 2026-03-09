import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staffGetProfileDetails } from "@/lib/actions/staff";
import { StaffProfileView } from "@/components/staff/staff-profile-view";

export const dynamic = "force-dynamic";

interface StaffProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function StaffProfilePage({ params }: StaffProfilePageProps) {
  const { userId } = await params;
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    notFound();
  }

  const result = await staffGetProfileDetails(parsedUserId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/staff/profiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Details</h1>
          <p className="text-slate-500">Read-only view of created profile</p>
        </div>
      </div>

      <StaffProfileView
        user={result.data.user}
        profile={result.data.profile}
        images={result.data.images}
      />
    </div>
  );
}
