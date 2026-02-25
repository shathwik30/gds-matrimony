"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export function ReportsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentStatus = searchParams.get("status") || "pending";

  const handleStatusChange = (status: string) => {
    startTransition(() => {
      router.push(`/admin/reports?status=${status}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(option.value)}
          disabled={isPending}
          className={cn(
            currentStatus === option.value &&
              "bg-brand border-brand hover:bg-brand/90 text-white hover:text-white"
          )}
        >
          {option.label}
        </Button>
      ))}
      {isPending && <span className="ml-2 text-sm text-slate-500">Loading...</span>}
    </div>
  );
}
