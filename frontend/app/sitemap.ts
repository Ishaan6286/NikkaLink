import { MetadataRoute } from "next";

const BASE_URL = "https://nikkalink.vercel.app";

// Last significant content update — bump this when pages change meaningfully.
const SITE_UPDATED = "2026-07-17";

/**
 * Static sitemap — deliberately NOT using fs / process.cwd().
 *
 * Why static?
 * Vercel serverless functions run from a compiled bundle in /var/task.
 * The raw .tsx source files are NOT present at runtime, so any filesystem
 * scan via fs.readdirSync fails silently and produces an empty or broken
 * sitemap. A hardcoded list is prerendered by Next.js as a real static
 * asset (○ route) with Content-Type: application/xml — exactly what
 * Google Search Console requires.
 *
 * Rules:
 * - Public pages only (no /login, /dashboard, /admin, /api/*, /analytics/*)
 * - Homepage first, priority 1.0
 * - Absolute HTTPS URLs, no trailing slashes
 * - Fixed ISO-8601 lastmod dates (no new Date() — avoids cache-busting)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: SITE_UPDATED,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: SITE_UPDATED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: SITE_UPDATED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
