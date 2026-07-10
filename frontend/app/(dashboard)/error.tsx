"use client";

import { useEffect } from "react";
import { logAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logAuthError("Dashboard route error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-lg font-semibold">Dashboard failed to load</h1>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading the dashboard. Details were logged to
          the browser console.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" render={<Link href="/login" />}>
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  );
}
