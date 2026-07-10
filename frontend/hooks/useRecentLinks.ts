"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nikkalink_recent_links";
const MAX_LINKS = 10;

export interface RecentLink {
  id: string;
  short_code: string;
  original_url: string;
  short_url: string;
  created_at: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
}

function load(): RecentLink[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(links: RecentLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, MAX_LINKS)));
}

export function useRecentLinks() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  useEffect(() => {
    setLinks(load());
  }, []);

  const addLink = useCallback((link: Omit<RecentLink, "id" | "created_at">) => {
    setLinks((prev) => {
      const entry: RecentLink = {
        ...link,
        id: `${link.short_code}-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const filtered = prev.filter((l) => l.short_code !== link.short_code);
      const next = [entry, ...filtered].slice(0, MAX_LINKS);
      save(next);
      return next;
    });
  }, []);

  const removeLink = useCallback((id: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id);
      save(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setLinks((prev) => {
      const next = prev.map((l) =>
        l.id === id ? { ...l, is_favorite: !l.is_favorite } : l
      );
      save(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setLinks((prev) => {
      const next = prev.map((l) =>
        l.id === id ? { ...l, is_pinned: !l.is_pinned } : l
      );
      save(next);
      return next;
    });
  }, []);

  return { links, addLink, removeLink, toggleFavorite, togglePin };
}
