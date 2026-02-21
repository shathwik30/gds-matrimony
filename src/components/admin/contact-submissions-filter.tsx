"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

export function ContactSubmissionsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentStatus = searchParams.get("status") || "all";

  const handleStatusChange = (status: string) => {
    startTransition(() => {
      router.push(`/admin/contact-submissions?status=${status}`);
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
              "bg-brand text-white border-brand hover:bg-brand/90 hover:text-white"
          )}
        >
          {option.label}
        </Button>
      ))}
      {isPending && <span className="text-sm text-slate-500 ml-2">Loading...</span>}
    </div>
  );
}
