import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let syncPromise: Promise<boolean> | null = null;
let ssoUnavailable = false;

/** Wait until a backend JWT is available (or sync fails). */
export async function ensureBackendToken(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    return true;
  }

  if (ssoUnavailable) {
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
            ssoUnavailable = true;
            if (process.env.NODE_ENV === "development") {
              logAuthWarn(
                "ensureBackendToken: FRONTEND_SSO_SECRET not set - dashboard API calls disabled"
              );
            }
            return false;
          }

          if (process.env.NODE_ENV === "development") {
            logAuthWarn("ensureBackendToken: sync failed", {
              status: response.status,
              body,
            });
          } else {
            logAuthError("ensureBackendToken: sync failed", {
              status: response.status,
              body,
            });
          }
          return false;
        }

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
        if (process.env.NODE_ENV === "development") {
          logAuthWarn("ensureBackendToken: request failed", error);
        } else {
          logAuthError("ensureBackendToken: request failed", error);
        }
        return false;
      })
      .finally(() => {
        syncPromise = null;
      });
  }

  return syncPromise;
}

export function clearBackendTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  syncPromise = null;
}
