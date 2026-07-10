"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nikkalink_copy_history";
const MAX = 20;

export function useCopyHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      setHistory([]);
    }
  }, []);

  const recordCopy = useCallback((text: string) => {
    setHistory((prev) => {
      const next = [text, ...prev.filter((t) => t !== text)].slice(0, MAX);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, recordCopy };
}
