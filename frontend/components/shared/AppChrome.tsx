"use client";

import { useScrollNavbar } from "@/hooks/useScrollNavbar";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { BackToTop } from "@/components/shared/BackToTop";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";

/** Global UI chrome: scroll progress, offline banner, back-to-top. */
export function AppChrome() {
  const { progress } = useScrollNavbar();

  return (
    <>
      <OfflineIndicator />
      <ScrollProgress progress={progress} />
      <BackToTop />
    </>
  );
}
