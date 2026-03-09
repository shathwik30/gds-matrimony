import { StaffCreateProfileForm } from "@/components/staff/staff-create-profile-form";

export default function StaffCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Matrimonial Profile</h1>
        <p className="text-slate-500">Fill in all details to create a new profile</p>
      </div>

      <StaffCreateProfileForm />
    </div>
  );
}
