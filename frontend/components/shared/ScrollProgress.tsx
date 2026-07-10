"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  progress: number;
  className?: string;
}

export function ScrollProgress({ progress, className }: ScrollProgressProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none",
        className
      )}
      aria-hidden
    >
      <motion.div
        className="h-full bg-primary origin-left shadow-[0_0_8px_var(--primary)]"
        style={{ scaleX: progress, transformOrigin: "left" }}
        initial={false}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
}
