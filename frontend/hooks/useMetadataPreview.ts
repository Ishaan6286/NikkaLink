"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/env";
import { isValidUrl, normalizeUrlInput } from "@/lib/url-utils";
import type { LinkMetadata } from "@/types";

export function useMetadataPreview(url: string, enabled = true) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !url || !isValidUrl(url)) {
      setMetadata(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${getApiUrl()}/api/v1/intelligence/metadata/preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: normalizeUrlInput(url) }),
            signal: controller.signal,
          }
        );
        if (res.ok) {
          setMetadata(await res.json());
        } else {
          setMetadata(null);
        }
      } catch {
        if (!controller.signal.aborted) setMetadata(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, enabled]);

  return { metadata, loading };
}
