"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only log error digest in production to avoid leaking sensitive info
    if (process.env.NODE_ENV === "production") {
      console.error("Application error:", error.digest || "unknown");
    } else {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
