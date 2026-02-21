import { Suspense } from "react";
import { getContactSubmissions } from "@/lib/actions/admin";
import { ContactSubmissionsTable } from "@/components/admin/contact-submissions-table";
import { ContactSubmissionsFilter } from "@/components/admin/contact-submissions-filter";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface ContactSubmissionsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

async function ContactSubmissionsContent({ searchParams }: ContactSubmissionsPageProps) {
  const params = await searchParams;
  const status = params.status || "all";
  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const limit = 20;

  const result = await getContactSubmissions(page, limit, status);

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <p className="text-slate-500 text-center py-8">Failed to load contact submissions</p>
      </div>
    );
  }

  return (
    <ContactSubmissionsTable
      submissions={result.data.submissions}
      total={result.data.total}
      page={page}
      limit={limit}
    />
  );
}

export default async function ContactSubmissionsPage({ searchParams }: ContactSubmissionsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contact Submissions</h1>
        <p className="text-slate-500">View and manage contact form submissions</p>
      </div>

      {/* Filters */}
      <ContactSubmissionsFilter />

      {/* Table */}
      <Suspense
        fallback={
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          </div>
        }
      >
        <ContactSubmissionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
