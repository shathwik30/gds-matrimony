"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error - only digest in production
    if (process.env.NODE_ENV === "production") {
      console.error("Dashboard error:", error.digest || "unknown");
    } else {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  return (
    <div className="container-wide py-8">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We encountered an error while loading this page. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === "development" && error.message && (
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground font-mono text-sm break-all">{error.message}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
