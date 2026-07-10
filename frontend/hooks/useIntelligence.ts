import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { intelligenceService } from "@/services/intelligenceService";
import { toast } from "sonner";

export const INTEL_KEYS = {
  metadata: (code: string) => ["metadata", code] as const,
  health: (code: string) => ["health", code] as const,
  summary: (code: string) => ["summary", code] as const,
  collections: (parentId?: string) => ["collections", parentId] as const,
  preview: (url: string) => ["metadata-preview", url] as const,
  trending: ["trending"] as const,
};

export function useMetadataPreview(url: string, enabled = false) {
  return useQuery({
    queryKey: INTEL_KEYS.preview(url),
    queryFn: () => intelligenceService.previewMetadata(url),
    enabled: enabled && url.startsWith("http"),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLinkMetadata(shortCode: string) {
  return useQuery({
    queryKey: INTEL_KEYS.metadata(shortCode),
    queryFn: () => intelligenceService.getMetadata(shortCode),
    enabled: !!shortCode,
  });
}

export function useLinkHealth(shortCode: string) {
  return useQuery({
    queryKey: INTEL_KEYS.health(shortCode),
    queryFn: () => intelligenceService.getHealth(shortCode),
    enabled: !!shortCode,
    staleTime: 5 * 60_000,
  });
}

export function useCheckHealthNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shortCode: string) => intelligenceService.checkHealthNow(shortCode),
    onSuccess: (_, shortCode) => {
      qc.invalidateQueries({ queryKey: INTEL_KEYS.health(shortCode) });
      toast.success("Health check complete");
    },
    onError: () => toast.error("Health check failed"),
  });
}

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: (url: string) => intelligenceService.checkDuplicate(url),
  });
}

export function useAliasSuggestions() {
  return useMutation({
    mutationFn: ({ url, title }: { url: string; title?: string }) =>
      intelligenceService.suggestAliases(url, title),
  });
}

export function useGenerateSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shortCode: string) => intelligenceService.generateSummary(shortCode),
    onSuccess: (_, shortCode) => {
      qc.invalidateQueries({ queryKey: INTEL_KEYS.summary(shortCode) });
      toast.success("Summary generated");
    },
    onError: () => toast.error("Failed to generate summary"),
  });
}

export function useCollections(parentId?: string) {
  return useQuery({
    queryKey: INTEL_KEYS.collections(parentId),
    queryFn: () => intelligenceService.listCollections(parentId),
  });
}

export function useTrendingLinks() {
  return useQuery({
    queryKey: INTEL_KEYS.trending,
    queryFn: () => intelligenceService.getTrendingLinks(),
    staleTime: 5 * 60_000,
  });
}
