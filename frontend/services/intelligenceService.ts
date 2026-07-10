import api from "@/lib/api";
import { isIntelligenceUnavailable, isSkippableIntelligenceError } from "@/lib/api-errors";
import type {
  Collection,
  DuplicateCheckResult,
  LinkHealth,
  LinkMetadata,
  LinkSummary,
  PublicProfile,
} from "@/types";

export const intelligenceService = {
  async previewMetadata(url: string): Promise<LinkMetadata> {
    try {
      const res = await api.post<LinkMetadata>("/api/v1/intelligence/metadata/preview", { url });
      return res.data;
    } catch (error) {
      if (isIntelligenceUnavailable(error)) return {};
      throw error;
    }
  },

  async getMetadata(shortCode: string): Promise<LinkMetadata> {
    const res = await api.get<LinkMetadata>(`/api/v1/intelligence/metadata/${shortCode}`);
    return res.data;
  },

  async refreshMetadata(shortCode: string): Promise<LinkMetadata> {
    const res = await api.post<LinkMetadata>(`/api/v1/intelligence/metadata/${shortCode}/refresh`);
    return res.data;
  },

  async getHealth(shortCode: string): Promise<LinkHealth> {
    const res = await api.get<LinkHealth>(`/api/v1/intelligence/health/${shortCode}`);
    return res.data;
  },

  async checkHealthNow(shortCode: string): Promise<LinkHealth> {
    const res = await api.post<LinkHealth>(`/api/v1/intelligence/health/${shortCode}/check`);
    return res.data;
  },

  async checkDuplicate(originalUrl: string): Promise<DuplicateCheckResult> {
    try {
      const res = await api.post<DuplicateCheckResult>("/api/v1/intelligence/duplicates/check", {
        original_url: originalUrl,
      });
      return res.data;
    } catch (error) {
      if (isSkippableIntelligenceError(error)) {
        return { is_duplicate: false };
      }
      throw error;
    }
  },

  async suggestAliases(originalUrl: string, title?: string): Promise<string[]> {
    try {
      const res = await api.post<{ suggestions: string[] }>(
        "/api/v1/intelligence/aliases/suggest",
        { original_url: originalUrl, title }
      );
      return res.data.suggestions;
    } catch (error) {
      if (isIntelligenceUnavailable(error)) return [];
      throw error;
    }
  },

  async getSummary(shortCode: string): Promise<LinkSummary> {
    const res = await api.get<LinkSummary>(`/api/v1/intelligence/summary/${shortCode}`);
    return res.data;
  },

  async generateSummary(shortCode: string, force = false): Promise<LinkSummary> {
    const res = await api.post<LinkSummary>(
      `/api/v1/intelligence/summary/${shortCode}/generate`,
      null,
      { params: { force } }
    );
    return res.data;
  },

  async updateNotes(shortCode: string, notes: Record<string, unknown>) {
    const res = await api.patch(`/api/v1/intelligence/notes/${shortCode}`, notes);
    return res.data;
  },

  async listCollections(parentId?: string): Promise<Collection[]> {
    const res = await api.get<Collection[]>("/api/v1/collections", {
      params: parentId ? { parent_id: parentId } : {},
    });
    return res.data;
  },

  async createCollection(data: { name: string; description?: string; parent_id?: string; color?: string }) {
    const res = await api.post<Collection>("/api/v1/collections", data);
    return res.data;
  },

  async bulkMove(urlIds: string[], targetCollectionId: string) {
    const res = await api.post("/api/v1/collections/bulk-move", {
      url_ids: urlIds,
      target_collection_id: targetCollectionId,
    });
    return res.data;
  },

  async getPublicProfile(slug: string): Promise<PublicProfile> {
    const res = await api.get<PublicProfile>(`/api/v1/profiles/u/${slug}`);
    return res.data;
  },

  async updateProfile(data: Record<string, unknown>) {
    const res = await api.patch("/api/v1/profiles/me", data);
    return res.data;
  },

  async getAdvancedAnalytics(shortCode: string, days = 30) {
    const res = await api.get(`/api/v1/analytics-advanced/${shortCode}`, { params: { days } });
    return res.data;
  },

  async getTrendingLinks(limit = 10) {
    const res = await api.get("/api/v1/analytics-advanced/trending/links", { params: { limit } });
    return res.data;
  },
};
