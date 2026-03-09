import { adminGetStaffList } from "@/lib/actions/admin";
import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { StaffTable } from "@/components/admin/staff-table";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const result = await adminGetStaffList();
  const staff = result.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff Accounts</h1>
        <p className="text-slate-500">Manage staff members who can create matrimonial profiles</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CreateStaffForm />
        </div>
        <div className="lg:col-span-2">
          <StaffTable staff={staff} />
        </div>
      </div>
    </div>
  );
}
