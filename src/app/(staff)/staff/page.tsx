import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staffGetCreatedUserCount, staffGetMyCreatedUsers } from "@/lib/actions/staff";
import { formatDate, getFullName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const [countResult, recentResult] = await Promise.all([
    staffGetCreatedUserCount(),
    staffGetMyCreatedUsers(1, 5),
  ]);

  const totalProfiles = countResult.data || 0;
  const recentUsers = recentResult.data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1>
          <p className="text-slate-500">Manage matrimonial profiles</p>
        </div>
        <Button asChild>
          <Link href="/staff/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Create Profile
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalProfiles}</p>
              <p className="text-sm text-slate-500">Profiles Created</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <UserPlus className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                <Link href="/staff/create" className="text-brand hover:underline">
                  Create New
                </Link>
              </p>
              <p className="text-sm text-slate-500">Add a profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Profiles</h2>
          {totalProfiles > 5 && (
            <Link href="/staff/profiles" className="text-brand text-sm hover:underline">
              View all
            </Link>
          )}
        </div>

        {recentUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No profiles created yet.{" "}
            <Link href="/staff/create" className="text-brand hover:underline">
              Create your first profile
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Completion</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {getFullName(user.firstName, user.lastName)}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{user.email}</td>
                    <td className="px-6 py-3 text-slate-600 capitalize">{user.gender || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant="outline"
                        className={
                          (user.profileCompletion || 0) >= 70
                            ? "border-emerald-500 text-emerald-600"
                            : "border-amber-500 text-amber-600"
                        }
                      >
                        {user.profileCompletion || 0}%
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {user.createdAt ? formatDate(user.createdAt) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/staff/profiles/${user.id}`}
                        className="text-brand hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
