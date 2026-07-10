"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Zap, BarChart2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { getAuthErrorMessage, logAuthError } from "@/lib/auth-errors";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const features = [
  { icon: Zap, text: "Instant short links" },
  { icon: BarChart2, text: "Powerful analytics" },
  { icon: ShieldCheck, text: "Secure & private" },
];

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (!authError) return;

    const showError = async () => {
      let message = getAuthErrorMessage(authError);

      if (authError === "Configuration") {
        try {
          const res = await fetch("/api/auth/status", { cache: "no-store" });
          const status = (await res.json()) as { issues?: string[] };
          if (status.issues?.length) {
            message = `${message} Missing: ${status.issues.join("; ")}.`;
          }
        } catch {
          // keep default message
        }
      }

      toast.error(message);
      logAuthError("OAuth returned an error", { error: authError, callbackUrl });
    };

    void showError();
  }, [authError, callbackUrl]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="flex justify-center mb-8 pt-8 sm:pt-0">
        <BrandLogo href="/" iconClassName="h-11 w-11" wordmarkClassName="text-2xl" />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-primary" />

        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Welcome to NikkaLink
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your Google account to get started
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 rounded-full bg-muted/50 border border-border/50 px-3 py-1 text-xs text-muted-foreground"
              >
                <Icon className="h-3 w-3 text-primary" />
                {text}
              </div>
            ))}
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 text-sm font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-600" />
                <span className="text-gray-700">Redirecting to Google…</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span className="ml-3">Continue with Google</span>
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-border/50 bg-muted/20 px-8 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
