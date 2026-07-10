"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      if (navigator.vibrate) navigator.vibrate(10);
    } finally {
      setRefreshing(false);
      setPulling(false);
      pullDistance.current = 0;
    }
  }, [onRefresh]);

  const onTouchStart = (e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      pullDistance.current = Math.min(delta, 80);
      setPulling(pullDistance.current > 48);
    }
  };

  const onTouchEnd = () => {
    if (pulling && !refreshing) {
      void handleRefresh();
    } else {
      setPulling(false);
      pullDistance.current = 0;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {(pulling || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-background/90 border border-border/60 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            {refreshing ? "Refreshing…" : "Release to refresh"}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
