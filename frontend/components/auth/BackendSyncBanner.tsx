"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ensureBackendToken,
  hasBackendToken,
  isSsoNotConfigured,
  resetBackendSyncState,
} from "@/lib/backend-auth";

interface AuthStatusResponse {
  hasFrontendSsoSecret?: boolean;
}

/**
 * Warns when Google login succeeded but the Render backend JWT bridge is missing,
 * which causes links/analytics to not persist under the signed-in account.
 */
export function BackendSyncBanner() {
  const { status } = useSession();
  const [checking, setChecking] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [ssoConfigured, setSsoConfigured] = useState(true);
  const [synced, setSynced] = useState(true);

  const evaluate = useCallback(async () => {
    if (status !== "authenticated") {
      setChecking(false);
      setSynced(true);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" });
      const body = (await res.json()) as AuthStatusResponse;
      const secretOk = body.hasFrontendSsoSecret !== false;
      setSsoConfigured(secretOk);

      if (!secretOk) {
        setSynced(false);
        return;
      }

      const ok = await ensureBackendToken({ forceRetry: true });
      setSynced(ok && hasBackendToken());
    } catch {
      setSynced(false);
    } finally {
      setChecking(false);
    }
  }, [status]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  const handleRetry = async () => {
    setRetrying(true);
    resetBackendSyncState();
    await evaluate();
    setRetrying(false);
  };

  if (status !== "authenticated" || checking || synced) {
    return null;
  }

  const message = !ssoConfigured || isSsoNotConfigured()
    ? "Links and analytics are not saving to your account. Add FRONTEND_SSO_SECRET on Vercel (same value as Render) and redeploy."
    : "Could not connect your account to the API. Links created now may not appear in your dashboard.";

  return (
    <div className="mx-6 mt-4 lg:mx-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>{message}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-500/40"
        onClick={() => void handleRetry()}
        disabled={retrying}
      >
        {retrying ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Retry sync
      </Button>
    </div>
  );
}
