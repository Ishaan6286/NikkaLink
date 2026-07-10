"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmartClipboard } from "@/hooks/useSmartClipboard";

const DISMISS_KEY = "nikkalink_clipboard_dismissed";

interface LandingClipboardPromptProps {
  onPaste: (url: string) => void;
}

export function LandingClipboardPrompt({
  onPaste,
}: LandingClipboardPromptProps) {
  const { detectedUrl, startListening, dismiss, checkClipboard } =
    useSmartClipboard();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    setDismissed(!!wasDismissed);
    const cleanup = startListening();
    return cleanup;
  }, [startListening]);

  useEffect(() => {
    if (dismissed) return;
    const onInteraction = () => {
      checkClipboard();
    };
    window.addEventListener("click", onInteraction, { once: true });
    window.addEventListener("keydown", onInteraction, { once: true });
    return () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, [checkClipboard, dismissed]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    dismiss();
  };

  if (dismissed || !detectedUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-primary/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Clipboard className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">URL detected in clipboard</p>
            <p className="text-xs text-muted-foreground truncate">{detectedUrl}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("nikkalink:shorten-url", { detail: detectedUrl })
                );
                dismiss();
              }}
            >
              <Zap className="h-3 w-3" />
              Shorten
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                onPaste(detectedUrl);
                dismiss();
              }}
            >
              Paste
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
