import { NextResponse } from "next/server";
import { getAuthEnvStatus, useJwtSessions } from "@/lib/auth-env";
import { prisma } from "@/lib/prisma";

/** Safe auth configuration check — no secrets exposed. */
export async function GET() {
  const status = getAuthEnvStatus();

  let databaseConnected: boolean | null = null;
  if (!useJwtSessions() && status.hasDatabaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch {
      databaseConnected = false;
      if (!status.issues.some((i) => i.includes("DATABASE"))) {
        status.issues.push(
          "Database connection failed — update DATABASE_URL or set AUTH_SESSION_STRATEGY=jwt in .env.local for local dev"
        );
      }
    }
  }

  return NextResponse.json({
    ok: status.issues.length === 0,
    authUrl: status.authUrl,
    googleCallbackUrl: status.googleCallbackUrl,
    sessionStrategy: status.sessionStrategy,
    hasGoogleClientId: status.hasGoogleClientId,
    hasGoogleClientSecret: status.hasGoogleClientSecret,
    hasSecret: status.hasSecret,
    hasDatabaseUrl: status.hasDatabaseUrl,
    databaseConnected,
    hasFrontendSsoSecret: status.hasFrontendSsoSecret,
    issues: status.issues,
    warnings: status.warnings,
  });
}
