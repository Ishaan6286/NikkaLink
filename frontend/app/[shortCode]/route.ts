import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/env";

/** Matches backend short_code / custom_alias constraints. */
const SHORT_CODE_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

/**
 * Proxy short-link redirects through the Vercel frontend to the Render backend.
 * https://nikkalink.vercel.app/{code} → backend 302 → original URL
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  if (!SHORT_CODE_PATTERN.test(shortCode)) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const apiUrl = getApiUrl();
  const upstream = await fetch(`${apiUrl}/${encodeURIComponent(shortCode)}`, {
    method: "GET",
    redirect: "manual",
    headers: {
      "User-Agent": request.headers.get("user-agent") ?? "",
      Referer: request.headers.get("referer") ?? "",
      "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
    },
    cache: "no-store",
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, upstream.status);
    }
  }

  if (upstream.status === 404) {
    return NextResponse.json({ detail: "Short link not found" }, { status: 404 });
  }

  return NextResponse.json(
    { detail: "Unable to resolve short link" },
    { status: upstream.status >= 400 ? upstream.status : 502 }
  );
}
