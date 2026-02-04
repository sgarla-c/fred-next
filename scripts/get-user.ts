import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ids = ["testuser1", "rcuser1"];
  const users = await prisma.user.findMany({
    where: { usrId: { in: ids } },
    select: { usrId: true, firstNm: true, lastNm: true, usrRole: true },
  });
  for (const u of users) {
    console.log(`${u.usrId}: ${u.firstNm} ${u.lastNm} [${u.usrRole}]`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
