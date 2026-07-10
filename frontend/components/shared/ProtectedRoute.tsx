"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

const SESSION_LOAD_TIMEOUT_MS = 8_000;

function buildLoginUrl(pathname: string, error?: string) {
  const callbackUrl = encodeURIComponent(pathname || "/dashboard");
  const errorParam = error ? `&error=${encodeURIComponent(error)}` : "";
  return `/login?callbackUrl=${callbackUrl}${errorParam}`;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [sessionProbeFailed, setSessionProbeFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (status !== "loading") {
      setTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimedOut(true);
      logAuthWarn("Session loading timed out on a protected route", { pathname });
    }, SESSION_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [status, pathname]);

  useEffect(() => {
    if (status !== "loading" && !timedOut) {
      return;
    }

    let cancelled = false;

    async function probeSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (!response.ok || body?.message) {
          setSessionProbeFailed(true);
          logAuthError("Session endpoint unavailable on protected route", {
            pathname,
            status: response.status,
            body,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSessionProbeFailed(true);
          logAuthError("Session probe failed on protected route", error);
        }
      }
    }

    if (timedOut) {
      void probeSession();
    }

    return () => {
      cancelled = true;
    };
  }, [status, timedOut, pathname]);

  useEffect(() => {
    const shouldRedirect =
      status === "unauthenticated" || sessionProbeFailed || timedOut;

    if (!shouldRedirect || redirected.current) {
      return;
    }

    redirected.current = true;
    const error = sessionProbeFailed ? "Configuration" : undefined;
    logAuthWarn("Redirecting unauthenticated user to login", {
      pathname,
      status,
      sessionProbeFailed,
      timedOut,
    });
    window.location.assign(buildLoginUrl(pathname || "/dashboard", error));
  }, [status, pathname, sessionProbeFailed, timedOut]);

  if (
    status === "loading" &&
    !timedOut &&
    !sessionProbeFailed
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    sessionProbeFailed ||
    timedOut
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
