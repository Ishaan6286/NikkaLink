import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedPaths = ["/dashboard"];

// Routes that should redirect to dashboard if already logged in
const authPaths = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedPath = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Match everything except static files, images, and Next internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)|api/auth).*)",
  ],
};
