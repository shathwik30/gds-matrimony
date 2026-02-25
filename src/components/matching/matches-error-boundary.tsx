"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function MatchesErrorFallback() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="text-destructive h-10 w-10" />
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-muted-foreground text-sm">
          We couldn&apos;t load matches right now. Please refresh the page.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}

export function MatchesErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary FallbackComponent={MatchesErrorFallback}>{children}</ErrorBoundary>;
}
