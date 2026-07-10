"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCopyHistory } from "@/hooks/useCopyHistory";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function CopyButton({
  text,
  className,
  label = "Copy Link",
  showLabel = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { recordCopy } = useCopyHistory();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      recordCopy(text);
      if (navigator.vibrate) navigator.vibrate(10);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }, [text, recordCopy]);

  const button = (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      className={cn(
        showLabel ? "gap-2 h-8" : "h-7 w-7 shrink-0",
        copied && "text-green-500",
        className
      )}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {showLabel && <span className="text-xs font-medium">Copied</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            {showLabel && <span className="text-xs">{label}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );

  if (showLabel) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{copied ? "Copied!" : label}</TooltipContent>
    </Tooltip>
  );
}
