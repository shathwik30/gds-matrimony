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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="py-8 text-center text-slate-500">Failed to load reports</p>
      </div>
    );
  }

  return <ReportsTable reports={result.data} />;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Reports</h1>
        <p className="text-slate-500">Review and manage reported users</p>
      </div>

      <ReportsFilter />

      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-brand h-8 w-8 animate-spin" />
            </div>
          </div>
        }
      >
        <ReportsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
