// ─── Analytics React Query hooks ──────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";

export const ANALYTICS_KEYS = {
  summary: (code: string) => ["analytics", "summary", code] as const,
  clicks: (code: string) => ["analytics", "clicks", code] as const,
  timeseries: (code: string, days: number) =>
    ["analytics", "timeseries", code, days] as const,
};

export function useAnalyticsSummary(shortCode: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.summary(shortCode),
    queryFn: () => analyticsService.getSummary(shortCode),
    enabled: !!shortCode,
  });
}

export function useClickList(shortCode: string, page = 1) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.clicks(shortCode),
    queryFn: () => analyticsService.getClicks(shortCode, page),
    enabled: !!shortCode,
  });
}

export function useTimeSeries(shortCode: string, days = 30) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.timeseries(shortCode, days),
    queryFn: () => analyticsService.getTimeSeries(shortCode, days),
    enabled: !!shortCode,
  });
}
