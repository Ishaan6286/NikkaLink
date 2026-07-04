import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  console.log("Testing Prisma connection to Neon PostgreSQL...");

  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Current users in database: ${userCount}`);
  } catch (e) {
    console.error("Database connection failed:");
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
