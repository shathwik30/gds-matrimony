import { Suspense } from "react";
import { getAdminUsers } from "@/lib/actions/admin";
import type { AdminUserFilters } from "@/lib/actions/admin";
import { UsersTable } from "@/components/admin/users-table";
import { UsersSearch } from "@/components/admin/users-search";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    filter?: string;
    status?: string;
    gender?: string;
    subscription?: string;
    trustLevel?: string;
    married?: string;
    profileCompletion?: string;
    emailVerified?: string;
    subCaste?: string;
    country?: string;
    state?: string;
    birthYearFrom?: string;
    birthYearTo?: string;
    sort?: string;
  }>;
}

async function UsersContent({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const filter = params.filter || "";

  const filters: AdminUserFilters = {
    status: params.status,
    gender: params.gender,
    subscription: params.subscription,
    trustLevel: params.trustLevel,
    married: params.married,
    profileCompletion: params.profileCompletion,
    emailVerified: params.emailVerified,
    subCaste: params.subCaste,
    country: params.country,
    state: params.state,
    birthYearFrom: params.birthYearFrom,
    birthYearTo: params.birthYearTo,
    sort: params.sort,
  };

  const result = await getAdminUsers(page, 20, search, filter, filters);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="py-8 text-center text-slate-500">Failed to load users</p>
      </div>
    );
  }

  return <UsersTable users={result.data.users} total={result.data.total} currentPage={page} />;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">View and manage all registered users</p>
        </div>
      </div>

      <UsersSearch />

      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-brand h-8 w-8 animate-spin" />
            </div>
          </div>
        }
      >
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
