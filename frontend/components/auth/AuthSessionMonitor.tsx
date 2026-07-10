"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

const PROTECTED_PREFIX = "/dashboard";

/**
 * Observes NextAuth session state and logs auth problems to the browser console.
 */
export function AuthSessionMonitor() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastStatus = useRef(status);
  const configErrorLogged = useRef(false);

  useEffect(() => {
    if (lastStatus.current === status) {
      return;
    }

    if (status === "unauthenticated" && pathname?.startsWith(PROTECTED_PREFIX)) {
      logAuthWarn("No session on a protected route", { pathname });
    }

    if (status === "authenticated" && !session?.user) {
      logAuthError("Authenticated status but session.user is missing", {
        pathname,
      });
    }

    lastStatus.current = status;
  }, [status, session, pathname]);

  useEffect(() => {
    let cancelled = false;

    async function verifySessionEndpoint() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok || body?.message) {
          if (!configErrorLogged.current) {
            configErrorLogged.current = true;
            logAuthError("Session endpoint returned an error", {
              status: response.status,
              statusText: response.statusText,
              pathname,
              body,
            });
          }
          return;
        }

        if (!cancelled && pathname?.startsWith(PROTECTED_PREFIX) && !body?.user) {
          logAuthWarn("Session endpoint returned no user on a protected route", {
            pathname,
          });
        }
      } catch (error) {
        if (!cancelled) {
          logAuthError("Failed to fetch /api/auth/session", error);
        }
      }
    }

    if (pathname?.startsWith(PROTECTED_PREFIX) || pathname === "/login") {
      void verifySessionEndpoint();
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, status]);

  return null;
}
