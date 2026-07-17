import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

// Directories to ignore during automatic sitemap routing
const EXCLUDE_DIRS = new Set([
  "api",
  "dashboard",
  "offline",
  "~offline",
]);

function getPublicRoutes(dir: string, baseDir: string = ""): string[] {
  let routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      const folderName = file.name;

      // Skip dynamic routes (starting with [), special segments (starting with ~),
      // explicit excluded folders, or anything related to dashboard / private pages.
      if (
        folderName.startsWith("[") ||
        folderName.startsWith("~") ||
        EXCLUDE_DIRS.has(folderName) ||
        folderName.includes("dashboard")
      ) {
        continue;
      }

      // Check if folder is a route group (e.g. (auth) or (dashboard))
      const isRouteGroup = folderName.startsWith("(") && folderName.endsWith(")");
      const nextBaseDir = isRouteGroup
        ? baseDir
        : (baseDir ? `${baseDir}/${folderName}` : `/${folderName}`);

      routes = routes.concat(getPublicRoutes(path.join(dir, folderName), nextBaseDir));
    } else if (file.name === "page.tsx") {
      routes.push(baseDir || "/");
    }
  }

  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDirectory = path.join(process.cwd(), "app");
  let routes: string[] = [];

  try {
    routes = getPublicRoutes(appDirectory);
  } catch (error) {
    console.error("Error generating sitemap dynamically:", error);
  }

  // Deduplicate and fallback to ensure at least core pages exist
  const uniqueRoutes = Array.from(new Set(routes));
  if (uniqueRoutes.length === 0) {
    uniqueRoutes.push("/", "/about", "/features", "/privacy", "/terms", "/login");
  }

  const baseUrl = "https://nikkalink.vercel.app";

  return uniqueRoutes.map((route) => {
    let priority = 0.8;
    let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "weekly";

    if (route === "/") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (route === "/privacy" || route === "/terms") {
      priority = 0.5;
      changeFrequency = "monthly";
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}
