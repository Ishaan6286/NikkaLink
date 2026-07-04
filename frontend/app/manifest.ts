import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NikkaLink URL Shortener",
    short_name: "NikkaLink",
    description: "Create short links in seconds, share anywhere, and monitor performance.",
    start_url: "/",
    display: "standalone",
    background_color: "#020817", // Matches the background color in tailwind dark mode
    theme_color: "#0ea5e9", // A close match to primary cyan-500
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
