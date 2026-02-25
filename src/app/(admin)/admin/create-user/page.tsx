import { CreateUserForm } from "@/components/admin/create-user-form";

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New User</h1>
        <p className="text-slate-500">Create a new user account with pre-verified email</p>
      </div>

      <div className="max-w-2xl">
        <CreateUserForm />
      </div>
    </div>
  );
}
