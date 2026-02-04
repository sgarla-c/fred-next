import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const districts = await prisma.district.findMany({
    orderBy: { distNbr: 'asc' },
    select: { distNbr: true, distNm: true },
  });
  console.log(`Found ${districts.length} districts`);
  for (const d of districts) {
    const sections = await prisma.section.findMany({
      where: { distNbr: d.distNbr },
      orderBy: { sectNbr: 'asc' },
      select: { sectId: true, sectNbr: true, sectNm: true },
    });
    const marker = /dallas/i.test(d.distNm) ? ' (DALLAS?)' : '';
    console.log(`District ${d.distNbr} - ${d.distNm}${marker} | Sections: ${sections.length}`);
    sections.slice(0, 5).forEach(s => {
      console.log(`  - sectId=${s.sectId} sectNbr=${s.sectNbr} sectNm=${s.sectNm}`);
    });
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
