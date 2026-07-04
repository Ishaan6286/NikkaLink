// ─── Auth hooks using NextAuth v5 ─────────────────────────────────────────────
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        toast.error("Sign-in failed. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  };

  return handleSignIn;
}

export function useLogout() {
  const router = useRouter();

  return async () => {
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
