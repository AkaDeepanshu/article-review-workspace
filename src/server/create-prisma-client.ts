import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "easySLR/env";
import { PrismaClient } from "../../generated/prisma";

export function createPrismaClient() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}
