// ─── Auth hooks using NextAuth v5 ─────────────────────────────────────────────
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthErrorMessage, logAuthError } from "@/lib/auth-errors";
import { clearBackendTokens } from "@/lib/backend-auth";

export function useMe() {
  const { data: session, status } = useSession();
  return {
    data: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

export function useGoogleSignIn() {
  const router = useRouter();

  const handleSignIn = async (callbackUrl = "/dashboard") => {
    try {
      const result = await signIn("google", {
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        logAuthError("useGoogleSignIn failed", { error: result.error });
        toast.error(getAuthErrorMessage(result.error));
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      logAuthError("useGoogleSignIn threw an exception", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return handleSignIn;
}

export function useLogout() {
  const router = useRouter();

  return async () => {
    clearBackendTokens();
    await signOut({ redirect: false });
    router.push("/login");
    toast.success("Logged out successfully.");
  };
}

// Legacy compatibility — kept so old imports don't break during migration
export function useLogin() {
  const signInWithGoogle = useGoogleSignIn();
  return {
    mutate: () => signInWithGoogle(),
    isPending: false,
  };
}
