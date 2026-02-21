import { Suspense } from "react";
import { getPendingVerifications } from "@/lib/actions/admin";
import { VerificationsTable } from "@/components/admin/verifications-table";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function VerificationsContent() {
  const result = await getPendingVerifications();

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <p className="text-slate-500 text-center py-8">Failed to load verifications</p>
      </div>
    );
  }

  return <VerificationsTable verifications={result.data} />;
}

export default function VerificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification Requests</h1>
        <p className="text-slate-500">Review and process user verification documents</p>
      </div>

      {/* Verifications Table */}
      <Suspense
        fallback={
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          </div>
        }
      >
        <VerificationsContent />
      </Suspense>
    </div>
  );
}
