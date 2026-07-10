"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ensureBackendToken, clearBackendTokens } from "@/lib/backend-auth";

/**
 * After NextAuth Google sign-in, exchange the session for backend JWT tokens
 * so dashboard API calls can authenticate with the Render backend.
 */
export function BackendAuthSync() {
  const { status } = useSession();
  const syncing = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || syncing.current) {
      return;
    }

    syncing.current = true;
    void ensureBackendToken().finally(() => {
      syncing.current = false;
    });
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearBackendTokens();
    }
  }, [status]);

  return null;
}
