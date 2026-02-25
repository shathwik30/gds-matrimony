import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card space-y-2 rounded-xl border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}
