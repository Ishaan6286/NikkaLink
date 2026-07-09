/**
 * Centralized environment variables for the Next.js frontend.
 * In production, NEXT_PUBLIC_* values must be set on Vercel — no localhost fallbacks.
 */

const DEV_API_URL = "http://localhost:8000";
const DEV_APP_URL = "http://localhost:3000";

function requireInProduction(value: string | undefined, name: string): string {
  if (value) {
    return value.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }
  return "";
}

export function getApiUrl(): string {
  const url = requireInProduction(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL"
  );
  return url || DEV_API_URL;
}

export function getPublicAppUrl(): string {
  const url = requireInProduction(
    process.env.NEXT_PUBLIC_APP_URL,
    "NEXT_PUBLIC_APP_URL"
  );
  return url || DEV_APP_URL;
}

export function buildPublicShortUrl(shortCode: string): string {
  return `${getPublicAppUrl()}/${shortCode}`;
}

export function buildApiDocsUrl(): string {
  return `${getApiUrl()}/docs`;
}
