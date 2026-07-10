import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function normalizeDatabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: normalizeDatabaseUrl(env("DATABASE_URL")),
  },
});
