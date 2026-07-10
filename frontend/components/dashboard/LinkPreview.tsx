"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { LinkMetadata } from "@/types";
import { ExternalLink, Globe } from "lucide-react";
import Image from "next/image";

interface LinkPreviewProps {
  metadata?: LinkMetadata | null;
  isLoading?: boolean;
  url?: string;
}

export function LinkPreview({ metadata, isLoading, url }: LinkPreviewProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!metadata?.title && !metadata?.description) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 animate-in fade-in duration-300">
      <div className="flex gap-3">
        {metadata.og_image_url ? (
          <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted">
            <Image
              src={metadata.og_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : metadata.favicon_url ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted shrink-0">
            <Image src={metadata.favicon_url} alt="" width={32} height={32} unoptimized />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted shrink-0">
            <Globe className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{metadata.title}</p>
          {metadata.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {metadata.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <span>{metadata.site_name}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
