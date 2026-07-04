// ─── URL service ──────────────────────────────────────────────────────────────
import api from "@/lib/api";
import {
  CreateURLPayload,
  PaginatedResponse,
  URLItem,
  URLListParams,
  UpdateURLPayload,
} from "@/types";

export const urlService = {
  async createURL(data: CreateURLPayload): Promise<URLItem> {
    const res = await api.post<URLItem>("/api/v1/urls", data);
    return res.data;
  },

  async listURLs(
    params: URLListParams = {}
  ): Promise<PaginatedResponse<URLItem>> {
    const res = await api.get<PaginatedResponse<URLItem>>("/api/v1/urls", {
      params,
    });
    return res.data;
  },

  async getURL(shortCode: string): Promise<URLItem> {
    const res = await api.get<URLItem>(`/api/v1/urls/${shortCode}`);
    return res.data;
  },

  async updateURL(
    shortCode: string,
    data: UpdateURLPayload
  ): Promise<URLItem> {
    const res = await api.patch<URLItem>(`/api/v1/urls/${shortCode}`, data);
    return res.data;
  },

  async deleteURL(shortCode: string): Promise<void> {
    await api.delete(`/api/v1/urls/${shortCode}`);
  },

  getQRCodeURL(shortCode: string): string {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${apiUrl}/api/v1/urls/${shortCode}/qr`;
  },

  getShortURL(shortCode: string): string {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${apiUrl}/${shortCode}`;
  },
};
