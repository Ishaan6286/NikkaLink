import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let syncPromise: Promise<boolean> | null = null;
let ssoNotConfigured = false;

export class BackendAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "sso_not_configured" | "sso_sync_failed" | "not_authenticated" = "sso_sync_failed"
  ) {
    super(message);
    this.name = "BackendAuthError";
  }
}

export function hasBackendToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function hasNextAuthSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.cookie.includes("__Secure-authjs.session-token") ||
    document.cookie.includes("authjs.session-token")
  );
}

/** Reset cached SSO-unavailable state (e.g. after env fix or user retry). */
export function resetBackendSyncState(): void {
  ssoNotConfigured = false;
  syncPromise = null;
}

interface EnsureBackendTokenOptions {
  /** Bypass the SSO-not-configured short-circuit for an explicit retry. */
  forceRetry?: boolean;
}

/** Wait until a backend JWT is available (or sync fails). */
export async function ensureBackendToken(
  options: EnsureBackendTokenOptions = {}
): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    return true;
  }

  if (ssoNotConfigured && !options.forceRetry) {
    return false;
  }

  if (!syncPromise) {
    syncPromise = fetch("/api/auth/backend-token", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));

          if (
            response.status === 503 &&
            (body as { code?: string }).code === "sso_not_configured"
          ) {
            ssoNotConfigured = true;
            logAuthError(
              "ensureBackendToken: FRONTEND_SSO_SECRET not set on Vercel — dashboard links will not save to your account"
            );
            return false;
          }

          logAuthError("ensureBackendToken: sync failed", {
            status: response.status,
            body,
          });
          return false;
        }

        ssoNotConfigured = false;
        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        }
        return Boolean(data.access_token);
      })
      .catch((error) => {
        logAuthError("ensureBackendToken: request failed", error);
        return false;
      })
      .finally(() => {
        syncPromise = null;
      });
  }

  return syncPromise;
}

/** Require a backend JWT for dashboard API calls (links, analytics list). */
export async function requireBackendToken(): Promise<void> {
  const ok = await ensureBackendToken({ forceRetry: true });
  if (ok && hasBackendToken()) {
    return;
  }

  if (ssoNotConfigured || !ok) {
    throw new BackendAuthError(
      "Your account is not connected to the API. Set FRONTEND_SSO_SECRET on Vercel to the same value as Render, then redeploy both services.",
      "sso_not_configured"
    );
  }

  if (hasNextAuthSessionCookie()) {
    throw new BackendAuthError(
      "Could not sync your login with the API. Try signing out and back in, or check that FRONTEND_SSO_SECRET matches on Vercel and Render.",
      "sso_sync_failed"
    );
  }

  throw new BackendAuthError("Please sign in to continue.", "not_authenticated");
}

export function clearBackendTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  syncPromise = null;
}

export function isSsoNotConfigured(): boolean {
  return ssoNotConfigured;
}
