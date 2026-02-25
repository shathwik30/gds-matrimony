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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="py-8 text-center text-slate-500">Failed to load contact submissions</p>
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

export default async function ContactSubmissionsPage({
  searchParams,
}: ContactSubmissionsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contact Submissions</h1>
        <p className="text-slate-500">View and manage contact form submissions</p>
      </div>

      <ContactSubmissionsFilter />

      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-brand h-8 w-8 animate-spin" />
            </div>
          </div>
        }
      >
        <ContactSubmissionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
