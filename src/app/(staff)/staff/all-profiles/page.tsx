import { staffGetAllPlatformProfiles } from "@/lib/actions/staff";
import { AllProfilesTable } from "@/components/staff/all-profiles-table";

export const dynamic = "force-dynamic";

export default async function StaffAllProfilesPage() {
  const result = await staffGetAllPlatformProfiles(1, 20);
  const users = result.data?.users || [];
  const total = result.data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Platform Profiles</h1>
        <p className="text-slate-500">Browse all profiles on the platform</p>
      </div>

      <AllProfilesTable initialUsers={users} initialTotal={total} />
    </div>
  );
}
