"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  ExternalLink,
  QrCode,
  Trash2,
  Star,
  Pin,
  Link2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecentLink } from "@/hooks/useRecentLinks";
import { useState, useCallback } from "react";
import { getApiUrl } from "@/lib/env";
import { EmptyState } from "@/components/shared/EmptyState";

interface RecentLinksSectionProps {
  links: RecentLink[];
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  className?: string;
}

export function RecentLinksSection({
  links,
  onRemove,
  onToggleFavorite,
  onTogglePin,
  className,
}: RecentLinksSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (link: RecentLink) => {
    await navigator.clipboard.writeText(link.short_url);
    setCopiedId(link.id);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const sorted = [...links].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (links.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-6", className)}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Recent Links
        </h3>
        <span className="text-xs text-muted-foreground">Stored locally</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((link) => (
            <motion.div
              key={link.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8, height: 0 }}
              className="group flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {link.short_url}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {link.original_url}
                </p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopy(link)}
                  aria-label="Copy link"
                >
                  {copiedId === link.id ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => window.open(link.short_url, "_blank")}
                  aria-label="Visit link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    window.open(
                      `${getApiUrl()}/api/v1/urls/qr/generate?url=${encodeURIComponent(link.short_url)}`,
                      "_blank"
                    )
                  }
                  aria-label="QR code"
                >
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", link.is_favorite && "text-yellow-500")}
                  onClick={() => onToggleFavorite(link.id)}
                  aria-label="Favorite"
                >
                  <Star className="h-3.5 w-3.5" fill={link.is_favorite ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", link.is_pinned && "text-primary")}
                  onClick={() => onTogglePin(link.id)}
                  aria-label="Pin"
                >
                  <Pin className="h-3.5 w-3.5" fill={link.is_pinned ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(link.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function RecentLinksEmpty() {
  return (
    <EmptyState
      icon={Link2}
      title="No recent links yet"
      description="Links you shorten will appear here for quick access."
      className="mt-4"
    />
  );
}
