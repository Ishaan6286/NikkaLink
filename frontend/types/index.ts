// ─── Global TypeScript types for NikkaLink ───────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  googleId: string | null;
  provider: string | null;
  lastLogin: string | null;
  plan: "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

// NextAuth session user (subset returned by useSession)
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface URLItem {
  id: string;
  short_code: string;
  original_url: string;
  user_id: string;
  is_active: boolean;
  total_clicks: number;
  tags: string[];
  expires_at: string | null;
  note_title?: string | null;
  private_notes?: string | null;
  is_favorite?: boolean;
  is_pinned?: boolean;
  color_label?: string | null;
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
  link_id: string;
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
  note_title?: string | null;
  private_notes?: string | null;
  is_favorite?: boolean;
  is_pinned?: boolean;
  color_label?: string | null;
}

// ── Link Intelligence ────────────────────────────────────────────────────────

export interface LinkMetadata {
  url_id?: string;
  canonical_url?: string | null;
  title?: string | null;
  description?: string | null;
  site_name?: string | null;
  og_image_url?: string | null;
  favicon_url?: string | null;
  language?: string | null;
  content_type?: string | null;
  fetched_at?: string | null;
  fetch_error?: string | null;
}

export interface LinkHealth {
  url_id: string;
  status: "healthy" | "warning" | "broken" | "unknown";
  last_checked_at?: string | null;
  failure_reason?: string | null;
  response_time_ms?: number | null;
  availability_pct: number;
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  existing?: {
    id: string;
    short_code: string;
    short_url: string;
    original_url: string;
    total_clicks: number;
    created_at: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  color?: string | null;
  sort_order: number;
  is_pinned: boolean;
  item_count: number;
  created_at: string;
}

export interface LinkSummary {
  url_id: string;
  summary: string;
  key_points?: string[];
  reading_time_min?: number;
  language?: string;
  generated_at: string;
  prompt_version: string;
}

export interface PublicProfile {
  username: string;
  profile_slug?: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  social_links: Record<string, string>;
  theme_config: Record<string, unknown>;
  pinned_links: Array<{
    short_code: string;
    original_url: string;
    note_title?: string;
    total_clicks: number;
  }>;
  public_stats: { total_links: number; total_clicks: number };
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
