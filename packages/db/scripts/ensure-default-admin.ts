/**
 * Creates or resets the default admin (same as seed) without running full seed.
 * Use against production DATABASE_URL from your machine:
 *   DATABASE_URL="postgresql://..." pnpm --filter @lenstrack/db run db:ensure-admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "admin@lenstrack.com";
const DEFAULT_PASSWORD = "Admin@123";

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.admin.upsert({
    where: { email: DEFAULT_EMAIL },
    update: { passwordHash: hash, name: "Super Admin" },
    create: {
      email: DEFAULT_EMAIL,
      name: "Super Admin",
      passwordHash: hash,
    },
  });
  console.log(`OK: ${DEFAULT_EMAIL} — password reset to default (see seed.ts).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
