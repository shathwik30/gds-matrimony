import { Skeleton, SkeletonForm } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-40 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Form card */}
        <div className="rounded-xl border bg-card p-6">
          <SkeletonForm />
        </div>
      </div>
    </div>
  );
}
