"use client";

import { useEffect } from "react";
import { logAuthError } from "@/lib/auth-errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logAuthError("Unhandled application error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#020817] text-white p-6">
        <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-white/70">
            An unexpected error occurred. Details were logged to the browser
            console.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#020817] hover:bg-white/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
