import { Suspense } from "react";
import { getAdminUsers } from "@/lib/actions/admin";
import { UsersTable } from "@/components/admin/users-table";
import { UsersSearch } from "@/components/admin/users-search";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    filter?: string;
  }>;
}

async function UsersContent({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const filter = params.filter || "";

  const result = await getAdminUsers(page, 20, search, filter);

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <p className="text-slate-500 text-center py-8">Failed to load users</p>
      </div>
    );
  }

  return (
    <UsersTable
      users={result.data.users}
      total={result.data.total}
      currentPage={page}
    />
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">View and manage all registered users</p>
        </div>
      </div>

      {/* Search & Filters */}
      <UsersSearch />

      {/* Users Table */}
      <Suspense
        fallback={
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          </div>
        }
      >
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
