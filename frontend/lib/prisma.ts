import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function normalizePrismaDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("DATABASE_URL is not set (required for NextAuth / Prisma)");
  }
  return url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
}

const connectionString = normalizePrismaDatabaseUrl(process.env.DATABASE_URL);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
