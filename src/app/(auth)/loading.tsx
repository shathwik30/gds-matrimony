import { Skeleton, SkeletonForm } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Title */}
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-10 w-40" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>

        {/* Form card */}
        <div className="bg-card rounded-xl border p-6">
          <SkeletonForm />
        </div>
      </div>
    </div>
  );
}
