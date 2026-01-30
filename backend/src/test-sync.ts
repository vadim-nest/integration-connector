// backend/src/test-sync.ts
import "dotenv/config";
import { runSync } from "./services/syncService";
import { prisma } from "./db/prisma";

async function main() {
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL ? "[set]" : "[missing]",
  );

  const res = await runSync();

  console.log("Sync result:");
  console.log(JSON.stringify(res, null, 2));

  // quick sanity counts
  const employeeCount = await prisma.employee.count();
  const shiftCount = await prisma.shift.count();

  console.log({ employeeCount, shiftCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
