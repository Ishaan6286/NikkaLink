"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLIPBOARD_KEY = "nikkalink_clipboard_history";
const URL_REGEX = /^https?:\/\/[^\s]+$/i;

interface ClipboardEntry {
  url: string;
  timestamp: number;
}

function loadHistory(): ClipboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLIPBOARD_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: ClipboardEntry[]) {
  localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(entries.slice(0, 20)));
}

/**
 * Smart clipboard — detects URLs after user-initiated paste/copy.
 * Never requests clipboard permission proactively.
 */
export function useSmartClipboard() {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [recentUrls, setRecentUrls] = useState<ClipboardEntry[]>([]);
  const listening = useRef(false);

  useEffect(() => {
    setRecentUrls(loadHistory());
  }, []);

  const addToHistory = useCallback((url: string) => {
    const entry: ClipboardEntry = { url, timestamp: Date.now() };
    setRecentUrls((prev) => {
      const filtered = prev.filter((e) => e.url !== url);
      const next = [entry, ...filtered].slice(0, 20);
      saveHistory(next);
      return next;
    });
  }, []);

  const checkClipboard = useCallback(async () => {
    if (!navigator.clipboard?.readText) return null;
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (URL_REGEX.test(text)) {
        setDetectedUrl(text);
        addToHistory(text);
        return text;
      }
    } catch {
      // Permission denied or unavailable — silent
    }
    return null;
  }, [addToHistory]);

  const startListening = useCallback(() => {
    if (listening.current) return;
    listening.current = true;

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && URL_REGEX.test(text)) {
        setDetectedUrl(text);
        addToHistory(text);
      }
    };

    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
      listening.current = false;
    };
  }, [addToHistory]);

  const dismiss = useCallback(() => setDetectedUrl(null), []);

  return {
    detectedUrl,
    recentUrls,
    checkClipboard,
    startListening,
    dismiss,
    addToHistory,
  };
}
