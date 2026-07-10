import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logAuthError } from "@/lib/auth-errors";
import { getApiUrl } from "@/lib/env";

/**
 * Exchange a verified NextAuth session for backend JWT tokens.
 * Called by BackendAuthSync after Google sign-in.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    logAuthError("backend-token: no NextAuth session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ssoSecret = process.env.FRONTEND_SSO_SECRET;
  if (!ssoSecret) {
    return NextResponse.json(
      { error: "SSO is not configured on the frontend", code: "sso_not_configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/v1/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-SSO-Secret": ssoSecret,
      },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name ?? null,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      logAuthError("backend-token: backend SSO failed", {
        status: response.status,
        detail,
      });
      return NextResponse.json(
        { error: "Backend SSO failed", detail },
        { status: response.status }
      );
    }

    const tokens = await response.json();
    return NextResponse.json(tokens);
  } catch (error) {
    logAuthError("backend-token: request failed", error);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 502 }
    );
  }
}
