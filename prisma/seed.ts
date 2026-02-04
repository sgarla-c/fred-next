import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Path to exported data from SQL Server
const DATA_DIR = path.join(__dirname, '../scripts/exported-data');

// Check if exported data exists
function hasExportedData(): boolean {
  return (
    fs.existsSync(path.join(DATA_DIR, 'districts.json')) &&
    fs.existsSync(path.join(DATA_DIR, 'sections.json')) &&
    fs.existsSync(path.join(DATA_DIR, 'nigp.json')) &&
    fs.existsSync(path.join(DATA_DIR, 'users.json'))
  );
}

// Load exported data from JSON files
function loadExportedData<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function main() {
  console.log('🌱 Seeding database...');

  const useExportedData = hasExportedData();

  if (useExportedData) {
    console.log('📦 Using exported data from SQL Server');
    await seedFromExportedData();
  } else {
    console.log('🧪 Using test data (no exported data found)');
    await seedTestData();
  }

  console.log('🎉 Seed completed successfully!');
}

async function seedFromExportedData() {
  // Seed Districts
  const districts = loadExportedData<{
    distNbr: number;
    distNm: string;
    distAbrvn?: string;
  }>('districts.json');

  for (const district of districts) {
    await prisma.district.upsert({
      where: { distNbr: district.distNbr },
      update: {},
      create: {
        distNbr: district.distNbr,
        distNm: district.distNm,
        distAbrvn: district.distAbrvn || null,
      },
    });
  }
  console.log(`✅ Created ${districts.length} districts from SQL Server`);

  // Seed Sections
  const sections = loadExportedData<{
    sectId: number;
    distNbr: number;
    sectNbr?: string;
    sectNm?: string;
  }>('sections.json');

  for (const section of sections) {
    await prisma.section.upsert({
      where: { sectId: section.sectId },
      update: {},
      create: {
        sectId: section.sectId,
        distNbr: section.distNbr,
        sectNbr: section.sectNbr || null,
        sectNm: section.sectNm || null,
      },
    });
  }
  console.log(`✅ Created ${sections.length} sections from SQL Server`);

  // Seed NIGP Codes
  const nigpCodes = loadExportedData<{
    nigpCd: string;
    dscr?: string;
    avgMonthlyRate?: number;
  }>('nigp.json');

  for (const nigp of nigpCodes) {
    await prisma.nigp.upsert({
      where: { nigpCd: nigp.nigpCd },
      update: {},
      create: {
        nigpCd: nigp.nigpCd,
        dscr: nigp.dscr || null,
        avgMonthlyRate: nigp.avgMonthlyRate || null,
      },
    });
  }
  console.log(`✅ Created ${nigpCodes.length} NIGP codes from SQL Server`);

  // Seed Users with default password
  const users = loadExportedData<{
    usrId: string;
    usrRole: string;
    firstNm: string;
    lastNm: string;
    usrEmail?: string;
  }>('users.json');

  console.log('🔐 Hashing passwords for users...');
  const defaultPassword = await bcrypt.hash('TxDOT2026!', 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { usrId: user.usrId },
      update: {},
      create: {
        usrId: user.usrId,
        usrRole: user.usrRole,
        firstNm: user.firstNm,
        lastNm: user.lastNm,
        usrEmail: user.usrEmail || `${user.usrId.toLowerCase()}@txdot.gov`,
        password: defaultPassword,
      },
    });
  }
  console.log(`✅ Created ${users.length} users from SQL Server`);
  console.log('⚠️  All users have default password: TxDOT2026!');
}

async function seedTestData() {

  // Seed Districts (TxDOT Districts)
  const districts = await Promise.all([
    prisma.district.upsert({
      where: { distNbr: 1 },
      update: {},
      create: {
        distNbr: 1,
        distNm: 'Paris',
        distAbrvn: 'PAR',
      },
    }),
    prisma.district.upsert({
      where: { distNbr: 2 },
      update: {},
      create: {
        distNbr: 2,
        distNm: 'Fort Worth',
        distAbrvn: 'FTW',
      },
    }),
    prisma.district.upsert({
      where: { distNbr: 3 },
      update: {},
      create: {
        distNbr: 3,
        distNm: 'Wichita Falls',
        distAbrvn: 'WFL',
      },
    }),
    prisma.district.upsert({
      where: { distNbr: 18 },
      update: {},
      create: {
        distNbr: 18,
        distNm: 'Dallas',
        distAbrvn: 'DAL',
      },
    }),
    prisma.district.upsert({
      where: { distNbr: 20 },
      update: {},
      create: {
        distNbr: 20,
        distNm: 'Austin',
        distAbrvn: 'AUS',
      },
    }),
  ]);

  console.log(`✅ Created ${districts.length} districts`);

  // Seed Sections for District 18 (Dallas)
  const sections = await Promise.all([
    prisma.section.upsert({
      where: { sectId: 1 },
      update: {},
      create: {
        sectId: 1,
        distNbr: 18,
        sectNbr: '18-01',
        sectNm: 'Dallas North',
      },
    }),
    prisma.section.upsert({
      where: { sectId: 2 },
      update: {},
      create: {
        sectId: 2,
        distNbr: 18,
        sectNbr: '18-02',
        sectNm: 'Dallas South',
      },
    }),
    prisma.section.upsert({
      where: { sectId: 3 },
      update: {},
      create: {
        sectId: 3,
        distNbr: 20,
        sectNbr: '20-01',
        sectNm: 'Austin Central',
      },
    }),
  ]);

  console.log(`✅ Created ${sections.length} sections`);

  // Seed NIGP Equipment Codes
  const nigpCodes = await Promise.all([
    prisma.nigp.upsert({
      where: { nigpCd: '06543' },
      update: {},
      create: {
        nigpCd: '06543',
        dscr: 'Excavator, Hydraulic',
        avgMonthlyRate: 8500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '06544' },
      update: {},
      create: {
        nigpCd: '06544',
        dscr: 'Bulldozer, Track Type',
        avgMonthlyRate: 12000.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '06545' },
      update: {},
      create: {
        nigpCd: '06545',
        dscr: 'Loader, Wheel Type',
        avgMonthlyRate: 6500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '06546' },
      update: {},
      create: {
        nigpCd: '06546',
        dscr: 'Backhoe, Wheel Type',
        avgMonthlyRate: 4500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '06547' },
      update: {},
      create: {
        nigpCd: '06547',
        dscr: 'Grader, Motor',
        avgMonthlyRate: 9500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '07201' },
      update: {},
      create: {
        nigpCd: '07201',
        dscr: 'Truck, Dump',
        avgMonthlyRate: 5500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '07205' },
      update: {},
      create: {
        nigpCd: '07205',
        dscr: 'Truck, Flatbed',
        avgMonthlyRate: 3500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '08101' },
      update: {},
      create: {
        nigpCd: '08101',
        dscr: 'Roller, Vibratory',
        avgMonthlyRate: 4000.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '08520' },
      update: {},
      create: {
        nigpCd: '08520',
        dscr: 'Generator, Portable',
        avgMonthlyRate: 1500.00,
      },
    }),
    prisma.nigp.upsert({
      where: { nigpCd: '09115' },
      update: {},
      create: {
        nigpCd: '09115',
        dscr: 'Trailer, Equipment',
        avgMonthlyRate: 2000.00,
      },
    }),
  ]);

  console.log(`✅ Created ${nigpCodes.length} NIGP equipment codes`);

  // Seed Test Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { usrId: 'testuser1' },
      update: {},
      create: {
        usrId: 'testuser1',
        usrRole: 'ES',
        firstNm: 'John',
        lastNm: 'Doe',
        usrEmail: 'sgarla-c@txdot.gov',
        password: hashedPassword,
      },
    }),
    prisma.user.upsert({
      where: { usrId: 'testuser2' },
      update: {},
      create: {
        usrId: 'testuser2',
        usrRole: 'ES',
        firstNm: 'Jane',
        lastNm: 'Smith',
        usrEmail: 'sgarla-c@txdot.gov',
        password: hashedPassword,
      },
    }),
    prisma.user.upsert({
      where: { usrId: 'rcuser1' },
      update: {},
      create: {
        usrId: 'rcuser1',
        usrRole: 'RC',
        firstNm: 'Bob',
        lastNm: 'Coordinator',
        usrEmail: 'sgarla-c@txdot.gov',
        password: hashedPassword,
      },
    }),
    prisma.user.upsert({
      where: { usrId: 'finuser1' },
      update: {},
      create: {
        usrId: 'finuser1',
        usrRole: 'FIN',
        firstNm: 'Sarah',
        lastNm: 'Finance',
        usrEmail: 'sgarla-c@txdot.gov',
        password: hashedPassword,
      },
    }),
    prisma.user.upsert({
      where: { usrId: 'manager1' },
      update: {},
      create: {
        usrId: 'manager1',
        usrRole: 'Manager',
        firstNm: 'Mike',
        lastNm: 'Manager',
        usrEmail: 'sgarla-c@txdot.gov',
        password: hashedPassword,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);
  console.log('   Username: testuser1, Password: password123 (ES role)');
  console.log('   Username: testuser2, Password: password123 (ES role)');
  console.log('   Username: rcuser1, Password: password123 (RC role)');
  console.log('   Username: finuser1, Password: password123 (FIN role)');
  console.log('   Username: manager1, Password: password123 (Manager role)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

