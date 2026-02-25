import { Skeleton, SkeletonGrid } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container-wide space-y-6 py-8">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Content grid */}
      <SkeletonGrid count={6} />
    </div>
  );
}
