"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authService.isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  if (!authService.isLoggedIn()) {
    return null;
  }

  return <>{children}</>;
}
