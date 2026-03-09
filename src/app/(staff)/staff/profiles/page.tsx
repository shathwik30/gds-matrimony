import { staffGetMyCreatedUsers } from "@/lib/actions/staff";
import { StaffProfilesTable } from "@/components/staff/staff-profiles-table";

export const dynamic = "force-dynamic";

export default async function StaffProfilesPage() {
  const result = await staffGetMyCreatedUsers(1, 20);
  const users = result.data?.users || [];
  const total = result.data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Created Profiles</h1>
        <p className="text-slate-500">All profiles you have created</p>
      </div>

      <StaffProfilesTable initialUsers={users} initialTotal={total} />
    </div>
  );
}
