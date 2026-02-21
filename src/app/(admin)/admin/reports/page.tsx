import { Suspense } from "react";
import { getAdminReports } from "@/lib/actions/admin";
import { ReportsTable } from "@/components/admin/reports-table";
import { ReportsFilter } from "@/components/admin/reports-filter";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

async function ReportsContent({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const status = params.status || "pending";

  const result = await getAdminReports(status);

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <p className="text-slate-500 text-center py-8">Failed to load reports</p>
      </div>
    );
  }

  return <ReportsTable reports={result.data} />;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Reports</h1>
        <p className="text-slate-500">Review and manage reported users</p>
      </div>

      {/* Filters */}
      <ReportsFilter />

      {/* Reports Table */}
      <Suspense
        fallback={
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          </div>
        }
      >
        <ReportsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
