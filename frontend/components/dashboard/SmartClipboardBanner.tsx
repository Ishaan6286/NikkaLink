"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clipboard, Link2, X } from "lucide-react";
import { useSmartClipboard } from "@/hooks/useSmartClipboard";

interface SmartClipboardBannerProps {
  onShorten: (url: string) => void;
}

export function SmartClipboardBanner({ onShorten }: SmartClipboardBannerProps) {
  const { detectedUrl, dismiss, startListening } = useSmartClipboard();

  useEffect(() => {
    return startListening();
  }, [startListening]);

  return (
    <AnimatePresence>
      {detectedUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-20 right-4 z-50 max-w-sm rounded-xl border border-border bg-card shadow-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Clipboard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">URL detected in clipboard</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{detectedUrl}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => { onShorten(detectedUrl); dismiss(); }} className="gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Shorten
                </Button>
                <Button size="sm" variant="outline" onClick={dismiss}>
                  Dismiss
                </Button>
              </div>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
