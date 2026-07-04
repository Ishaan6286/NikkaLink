// ─── Auth service (NextAuth session-based) ────────────────────────────────────
// Authentication is now handled entirely by NextAuth.js via HTTP-only cookies.
// This file is kept for API calls that need user context from the server.

export const authService = {
  // Check if a user session cookie likely exists (client-side heuristic)
  // True auth state should come from useSession() / server auth()
  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    // NextAuth session cookie name differs by environment
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
    return document.cookie.includes(cookieName);
  },
};

export default authService;
