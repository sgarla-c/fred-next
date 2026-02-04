import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Running DB checks...");

  const [districts, sections, nigps, users, rentals] = await Promise.all([
    prisma.district.count(),
    prisma.section.count(),
    prisma.nigp.count(),
    prisma.user.count(),
    prisma.rental.count(),
  ]);

  console.log(`Districts: ${districts}`);
  console.log(`Sections: ${sections}`);
  console.log(`NIGP: ${nigps}`);
  console.log(`Users: ${users}`);
  console.log(`Rentals: ${rentals}`);

  // Note: Counts are informational; UI may add data beyond seeds.
  let ok = true;

  // Check bcrypt hashes
  const userSamples = await prisma.user.findMany({ select: { usrId: true, password: true }, take: 5 });
  const allBcrypt = userSamples.every((u) => u.password.startsWith("$2b$") || u.password.startsWith("$2a$"));
  if (!allBcrypt) {
    console.error("FAIL: One or more user passwords are not bcrypt hashes.");
    ok = false;
  } else {
    console.log("Passwords: bcrypt hashes verified for sampled users.");
  }

  await prisma.$disconnect();

  console.log(ok ? "All DB checks passed." : "DB checks reported issues.");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
