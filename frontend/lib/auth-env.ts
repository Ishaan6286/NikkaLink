import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

const GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";

/** JWT sessions by default (works without Prisma DB). Set AUTH_SESSION_STRATEGY=database to use Prisma. */
export function useJwtSessions(): boolean {
  return process.env.AUTH_SESSION_STRATEGY !== "database";
}

export interface AuthEnvStatus {
  hasSecret: boolean;
  hasGoogleClientId: boolean;
  hasGoogleClientSecret: boolean;
  hasDatabaseUrl: boolean;
  hasFrontendSsoSecret: boolean;
  sessionStrategy: "jwt" | "database";
  authUrl: string | null;
  googleCallbackUrl: string | null;
  issues: string[];
  warnings: string[];
}

function resolveAuthUrl(): string | null {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    null
  );
}

/** Validate auth-related environment variables (server-side). */
export function getAuthEnvStatus(): AuthEnvStatus {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const authUrl = resolveAuthUrl();
  const jwtMode = useJwtSessions();
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!secret) {
    issues.push("Missing AUTH_SECRET or NEXTAUTH_SECRET");
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    issues.push("Missing GOOGLE_CLIENT_ID");
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    issues.push("Missing GOOGLE_CLIENT_SECRET");
  }
  if (!jwtMode && !process.env.DATABASE_URL) {
    issues.push("Missing DATABASE_URL (required for database sessions)");
  }
  if (!authUrl) {
    issues.push("Missing NEXTAUTH_URL, AUTH_URL, or NEXT_PUBLIC_APP_URL");
  }
  if (authUrl && !authUrl.startsWith("http")) {
    issues.push("NEXTAUTH_URL / AUTH_URL must be an absolute URL (https://…)");
  }
  if (!process.env.FRONTEND_SSO_SECRET) {
    warnings.push("Missing FRONTEND_SSO_SECRET (backend API bridge only)");
  }
  if (jwtMode) {
    warnings.push("Using JWT sessions (set AUTH_SESSION_STRATEGY=database for Prisma sessions)");
  }

  const normalizedAuthUrl = authUrl?.replace(/\/$/, "") ?? null;

  return {
    hasSecret: Boolean(secret),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasFrontendSsoSecret: Boolean(process.env.FRONTEND_SSO_SECRET),
    sessionStrategy: jwtMode ? "jwt" : "database",
    authUrl: normalizedAuthUrl,
    googleCallbackUrl: normalizedAuthUrl
      ? `${normalizedAuthUrl}${GOOGLE_CALLBACK_PATH}`
      : null,
    issues,
    warnings,
  };
}

/** Log configuration problems once at startup (server) or on demand (client diagnostics). */
export function reportAuthEnvIssues(context = "startup"): void {
  const status = getAuthEnvStatus();

  if (status.issues.length > 0) {
    logAuthError(`Auth environment issues (${context})`, {
      issues: status.issues,
      authUrl: status.authUrl,
      googleCallbackUrl: status.googleCallbackUrl,
    });
    return;
  }

  if (process.env.NODE_ENV === "development") {
    logAuthWarn(`Auth environment OK (${context})`, {
      authUrl: status.authUrl,
      googleCallbackUrl: status.googleCallbackUrl,
    });
  }
}
