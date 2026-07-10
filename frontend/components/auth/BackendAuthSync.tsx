"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ensureBackendToken,
  clearBackendTokens,
  hasBackendToken,
  isSsoNotConfigured,
} from "@/lib/backend-auth";

const RETRY_MS = 30_000;

/**
 * After NextAuth Google sign-in, exchange the session for backend JWT tokens
 * so dashboard API calls can authenticate with the Render backend.
 */
export function BackendAuthSync() {
  const { status } = useSession();
  const syncing = useRef(false);
  const warned = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const sync = async () => {
      if (syncing.current || hasBackendToken()) {
        return;
      }

      syncing.current = true;
      const ok = await ensureBackendToken({ forceRetry: true });
      syncing.current = false;

      if (!ok && !warned.current) {
        warned.current = true;
        const message = isSsoNotConfigured()
          ? "FRONTEND_SSO_SECRET is missing on Vercel — links will not save to your account."
          : "Could not sync your account with the API. Dashboard data may not load.";
        toast.error(message, { duration: 8000 });
      }

      if (ok) {
        warned.current = false;
      }
    };

    void sync();
    const interval = window.setInterval(() => {
      void sync();
    }, RETRY_MS);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearBackendTokens();
    }
  }, [status]);

  return null;
}
