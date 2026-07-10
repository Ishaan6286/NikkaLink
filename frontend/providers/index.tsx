"use client";

// ─── React Query + Theme + NextAuth providers wrapper ───────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { AuthSessionMonitor } from "@/components/auth/AuthSessionMonitor";
import { BackendAuthSync } from "@/components/auth/BackendAuthSync";
import { AuthErrorBoundary } from "@/components/shared/AuthErrorBoundary";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <SessionProvider refetchOnWindowFocus>
      <AuthErrorBoundary>
        <AuthSessionMonitor />
        <BackendAuthSync />
        <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delay={200}>
            {children}
            {mounted && (
              <Toaster
                richColors
                position="bottom-right"
                toastOptions={{
                  duration: 3000,
                }}
              />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
      </AuthErrorBoundary>
    </SessionProvider>
  );
}
