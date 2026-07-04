// ─── Analytics service ────────────────────────────────────────────────────────
import api from "@/lib/api";
import { AnalyticsSummary, ClickRecord, PaginatedResponse, TimeSeriesPoint } from "@/types";

export const analyticsService = {
  async getSummary(shortCode: string): Promise<AnalyticsSummary> {
    const res = await api.get<AnalyticsSummary>(
      `/api/v1/analytics/${shortCode}`
    );
    return res.data;
  },

  async getClicks(
    shortCode: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<ClickRecord>> {
    const res = await api.get<PaginatedResponse<ClickRecord>>(
      `/api/v1/analytics/${shortCode}/clicks`,
      { params: { page, page_size: pageSize } }
    );
    return res.data;
  },

  async getTimeSeries(
    shortCode: string,
    days = 30
  ): Promise<TimeSeriesPoint[]> {
    const res = await api.get<TimeSeriesPoint[]>(
      `/api/v1/analytics/${shortCode}/timeseries`,
      { params: { days } }
    );
    return res.data;
  },
};
