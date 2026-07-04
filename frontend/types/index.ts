// ─── Global TypeScript types for URL Shortener ───────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface URLItem {
  id: string;
  short_code: string;
  original_url: string;
  owner_id: string;
  is_active: boolean;
  total_clicks: number;
  tags: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AnalyticsSummary {
  short_code: string;
  original_url: string;
  total_clicks: number;
  unique_visitors: number;
  created_at: string;
  time_series: TimeSeriesPoint[];
  browsers: Record<string, number>;
  devices: Record<string, number>;
  os_distribution: Record<string, number>;
  referrers: Record<string, number>;
}

export interface TimeSeriesPoint {
  date: string;
  clicks: number;
}

export interface ClickRecord {
  id: string;
  url_id: string;
  ip_hash: string;
  browser: string | null;
  device: string | null;
  os: string | null;
  referrer: string | null;
  clicked_at: string;
}

export interface CreateURLPayload {
  original_url: string;
  custom_alias?: string;
  expires_at?: string;
  tags?: string[];
}

export interface UpdateURLPayload {
  original_url?: string;
  is_active?: boolean;
  expires_at?: string | null;
  tags?: string[];
}

export interface URLListParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  query?: string;
  tag?: string;
  is_active?: boolean;
}
