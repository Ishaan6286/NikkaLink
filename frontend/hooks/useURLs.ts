// ─── URL React Query hooks ────────────────────────────────────────────────────
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { urlService } from "@/services/urlService";
import { ensureBackendToken } from "@/lib/backend-auth";
import { CreateURLPayload, URLListParams, UpdateURLPayload } from "@/types";

export const URL_KEYS = {
  all: ["urls"] as const,
  list: (params: URLListParams) => ["urls", "list", params] as const,
  detail: (code: string) => ["urls", "detail", code] as const,
};

export function useURLs(params: URLListParams = {}) {
  return useQuery({
    queryKey: URL_KEYS.list(params),
    queryFn: async () => {
      await ensureBackendToken();
      return urlService.listURLs(params);
    },
    placeholderData: keepPreviousData,
  });
}

export function useURL(shortCode: string) {
  return useQuery({
    queryKey: URL_KEYS.detail(shortCode),
    queryFn: () => urlService.getURL(shortCode),
    enabled: !!shortCode,
  });
}

export function useCreateURL() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateURLPayload) => {
      const hasToken = await ensureBackendToken();
      if (!hasToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      return urlService.createURL(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: URL_KEYS.all });
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        message?: string;
        response?: { data?: { detail?: string } };
      };
      const msg =
        axiosErr.response?.data?.detail ??
        (axiosErr.message === "Network Error"
          ? "Cannot reach the API. Start the backend (docker compose up) or check NEXT_PUBLIC_API_URL."
          : "Failed to create URL.");
      toast.error(msg);
    },
  });
}

export function useUpdateURL() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      shortCode,
      data,
    }: {
      shortCode: string;
      data: UpdateURLPayload;
    }) => urlService.updateURL(shortCode, data),
    onSuccess: (_, { shortCode }) => {
      qc.invalidateQueries({ queryKey: URL_KEYS.all });
      qc.invalidateQueries({ queryKey: URL_KEYS.detail(shortCode) });
      toast.success("URL updated.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to update URL.";
      toast.error(msg);
    },
  });
}

export function useDeleteURL() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (shortCode: string) => urlService.deleteURL(shortCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: URL_KEYS.all });
      toast.success("URL deleted.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to delete URL.";
      toast.error(msg);
    },
  });
}
