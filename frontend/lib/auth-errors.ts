const AUTH_LOG_PREFIX = "[NikkaLink Auth]";

type AuthErrorContext = Record<string, unknown>;

/** Log authentication errors to the browser console (client) or server console. */
export function logAuthError(
  message: string,
  context?: AuthErrorContext | unknown
): void {
  if (context !== undefined) {
    console.error(`${AUTH_LOG_PREFIX} ${message}`, context);
    return;
  }
  console.error(`${AUTH_LOG_PREFIX} ${message}`);
}

export function logAuthWarn(
  message: string,
  context?: AuthErrorContext | unknown
): void {
  if (context !== undefined) {
    console.warn(`${AUTH_LOG_PREFIX} ${message}`, context);
    return;
  }
  console.warn(`${AUTH_LOG_PREFIX} ${message}`);
}

/** Map NextAuth error query params to user-facing messages. */
export function getAuthErrorMessage(errorCode: string | null | undefined): string {
  if (!errorCode || errorCode.trim() === "") {
    return "Sign-in failed. Check Google OAuth credentials in .env.local (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).";
  }

  const messages: Record<string, string> = {
    Configuration:
      "Authentication is misconfigured on the server. On Vercel, set AUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET (copy from frontend/.env), then redeploy. Visit /api/auth/status to see what is missing. In Google Cloud Console, add redirect URI: https://nikkalink.vercel.app/api/auth/callback/google",
    AccessDenied: "Access denied. Your account may not be authorized.",
    Verification: "The sign-in link has expired or was already used.",
    OAuthSignin: "Could not start Google sign-in. Check OAuth client settings.",
    OAuthCallback: "Google sign-in callback failed. Verify the authorized redirect URI.",
    OAuthCreateAccount: "Could not create your account. Please try again.",
    EmailCreateAccount: "Could not create your account. Please try again.",
    Callback: "Authentication callback failed.",
    OAuthAccountNotLinked:
      "This email is linked to another sign-in method. Use the original provider.",
    SessionRequired: "Please sign in to continue.",
    Default: "Sign-in failed. Please try again.",
  };

  return messages[errorCode] ?? messages.Default;
}
