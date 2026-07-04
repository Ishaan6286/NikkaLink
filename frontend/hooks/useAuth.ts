// ─── Auth React Query hooks ───────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";

export const AUTH_KEY = ["auth", "me"] as const;

export function useMe() {
  return useQuery({
    queryKey: AUTH_KEY,
    queryFn: authService.me,
    enabled: authService.isLoggedIn(),
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AUTH_KEY });
      toast.success("Welcome back!");
      router.push("/dashboard");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Invalid email or password.";
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Account created! Please log in.");
      router.push("/login");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Registration failed.";
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();

  return () => {
    authService.logout();
    qc.clear();
    router.push("/login");
    toast.success("Logged out.");
  };
}
