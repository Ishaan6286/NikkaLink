import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "NikkaLink | Smart URL Management Platform",
    template: "%s | NikkaLink",
  },
  description:
    "Short Links. Smarter Connections. A premium URL management platform with powerful analytics and custom aliases.",
  keywords: ["url shortener", "link management", "NikkaLink", "analytics", "qr code"],
  openGraph: {
    title: "NikkaLink | Smart URL Management Platform",
    description: "Short Links. Smarter Connections. A premium URL management platform.",
    url: "https://nikkalink.com",
    siteName: "NikkaLink",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
