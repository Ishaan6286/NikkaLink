import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { constructMetadata } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  ...constructMetadata(),
  title: {
    default: "NikkaLink | Fast & Secure URL Shortener",
    template: "%s | NikkaLink",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NikkaLink",
  },
  verification: {
    google: "google6aa2542ff12fd36b",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://nikkalink.vercel.app/#website",
      url: "https://nikkalink.vercel.app",
      name: "NikkaLink",
      description:
        "Create short links, custom URLs, QR codes and analytics with NikkaLink. Fast, secure and completely free.",
      publisher: {
        "@type": "Organization",
        name: "NikkaLink",
        url: "https://nikkalink.vercel.app",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://nikkalink.vercel.app/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://nikkalink.vercel.app/#app",
      name: "NikkaLink",
      url: "https://nikkalink.vercel.app",
      description:
        "A premium URL shortener with real-time analytics, custom aliases, QR code generation, and a developer REST API.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
