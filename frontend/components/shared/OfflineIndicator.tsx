"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineIndicator() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 bg-destructive/95 px-4 py-2 text-sm font-medium text-destructive-foreground backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          You&apos;re offline. Some features may be unavailable.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
