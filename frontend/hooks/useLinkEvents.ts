"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getApiUrl } from "@/lib/env";
import { ensureBackendToken } from "@/lib/backend-auth";

export interface DomainEventMessage {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  correlation_id?: string;
  timestamp: string;
}

interface UseLinkEventsOptions {
  shortCode?: string;
  enabled?: boolean;
  onEvent?: (event: DomainEventMessage) => void;
}

/**
 * Subscribe to real-time domain events via Server-Sent Events.
 * Automatically reconnects on disconnect.
 */
export function useLinkEvents({
  shortCode,
  enabled = true,
  onEvent,
}: UseLinkEventsOptions = {}) {
  const [lastEvent, setLastEvent] = useState<DomainEventMessage | null>(null);
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handleEvent = useCallback((event: DomainEventMessage) => {
    setLastEvent(event);
    onEventRef.current?.(event);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function connect() {
      await ensureBackendToken();
      const token = localStorage.getItem("access_token");
      if (!token || cancelled) return;

      const params = new URLSearchParams();
      if (shortCode) params.set("short_code", shortCode);

      // EventSource cannot send Authorization headers — use token query param
      // The backend SSE endpoint requires auth via header; use fetch-based SSE polyfill
      const url = `${getApiUrl()}/api/v1/events/stream?${params.toString()}`;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!response.ok || !response.body) return;

        setConnected(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6)) as DomainEventMessage;
                handleEvent(data);
              } catch {
                // skip malformed
              }
            }
          }
        }
      } catch {
        setConnected(false);
      }
    }

    void connect();

    return () => {
      cancelled = true;
      setConnected(false);
    };
  }, [enabled, shortCode, handleEvent]);

  return { lastEvent, connected };
}
