import { Metadata } from "next";

interface SEOOptions {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  robots?: "index,follow" | "noindex,nofollow";
  keywords?: string[];
}

const DEFAULT_KEYWORDS = [
  "url shortener",
  "link management",
  "NikkaLink",
  "analytics",
  "qr code",
  "custom alias",
];

const BASE_URL = "https://nikkalink.vercel.app";

/**
 * Reusable SEO Metadata Constructor.
 * Generates valid Next.js Metadata objects for layouts and pages, ensuring
 * deduplicated canonical tags, Open Graph tags, Twitter cards, and robot instructions.
 */
export function constructMetadata({
  title = "NikkaLink | Fast & Secure URL Shortener",
  description = "Create short links, custom URLs, QR codes and analytics with NikkaLink. Fast, secure and completely free.",
  canonical = "/",
  image = "/og-image.png",
  robots = "index,follow",
  keywords = DEFAULT_KEYWORDS,
}: SEOOptions = {}): Metadata {
  const index = robots === "index,follow";
  const absoluteImageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonical === "/" ? "" : canonical}`,
      siteName: "NikkaLink",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/logo.png", type: "image/png", sizes: "32x32" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [
        { url: "/icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}
