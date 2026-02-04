/**
 * Seed script to import Rental-PO relationships from legacy FRED SQL Server database
 * 
 * Run with: npx tsx scripts/seed-rental-po-links.ts
 * 
 * Requirements:
 * - SQL Server connection details in environment variables
 * - mssql package: npm install mssql
 * - Run after seed-po-data.ts to ensure POs exist
 */

import { PrismaClient } from '@prisma/client';
import sql from 'mssql';

const prisma = new PrismaClient();

// SQL Server configuration
const sqlConfig: sql.config = {
  server: process.env.LEGACY_DB_SERVER || 'localhost',
  database: process.env.LEGACY_DB_NAME || 'FRED_DATABASE',
  user: process.env.LEGACY_DB_USER,
  password: process.env.LEGACY_DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

interface LegacyRentalPO {
  RENTAL_ID: number;
  PO_ID: number;
  FISCAL_YR: string;
  RLSE_AMT: number | null;
}

async function main() {
  console.log('🔄 Starting Rental-PO link migration from legacy database...\n');

  try {
    // Connect to SQL Server
    console.log('📡 Connecting to SQL Server...');
    await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server\n');

    // Query legacy RENTAL_PO data
    console.log('📊 Querying legacy RENTAL_PO table...');
    const result = await sql.query<LegacyRentalPO>`
      SELECT 
        RENTAL_ID,
        PO_ID,
        FISCAL_YR,
        RLSE_AMT
      FROM dbo.RENTAL_PO
      ORDER BY RENTAL_ID, PO_ID
    `;

    const legacyLinks = result.recordset;
    console.log(`✅ Found ${legacyLinks.length} rental-PO links\n`);

    if (legacyLinks.length === 0) {
      console.log('⚠️  No rental-PO links found in legacy database');
      return;
    }

    // Transform and import data
    console.log('🔄 Importing rental-PO links...');
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const link of legacyLinks) {
      try {
        // Check if rental exists
        const rental = await prisma.rental.findUnique({
          where: { rentalId: link.RENTAL_ID },
        });

        if (!rental) {
          console.log(`  ⚠️  Rental ${link.RENTAL_ID} not found, skipping link to PO ${link.PO_ID}`);
          skipped++;
          continue;
        }

        // Check if PO exists
        const po = await prisma.purchaseOrder.findUnique({
          where: { poId: link.PO_ID },
        });

        if (!po) {
          console.log(`  ⚠️  PO ${link.PO_ID} not found, skipping link to Rental ${link.RENTAL_ID}`);
          skipped++;
          continue;
        }

        // Create or update the link
        await prisma.rentalPo.upsert({
          where: {
            rentalId_poId_fiscalYr: {
              rentalId: link.RENTAL_ID,
              poId: link.PO_ID,
              fiscalYr: link.FISCAL_YR,
            },
          },
          create: {
            rentalId: link.RENTAL_ID,
            poId: link.PO_ID,
            fiscalYr: link.FISCAL_YR,
            rlseAmt: link.RLSE_AMT,
          },
          update: {
            rlseAmt: link.RLSE_AMT,
          },
        });

        imported++;

        // Progress indicator
        if (imported % 100 === 0) {
          console.log(`  ✓ Imported ${imported}/${legacyLinks.length} links...`);
        }
      } catch (error) {
        errors++;
        console.error(
          `  ❌ Error importing link Rental ${link.RENTAL_ID} - PO ${link.PO_ID}:`,
          error
        );
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`  📊 Total: ${legacyLinks.length}`);
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);

    // Show some statistics
    const linkCount = await prisma.rentalPo.count();
    console.log(`\n📈 Total Rental-PO links in database: ${linkCount}`);

    // Show top POs by rental count
    const topPOs = await prisma.rentalPo.groupBy({
      by: ['poId'],
      _count: true,
      orderBy: {
        _count: {
          poId: 'desc',
        },
      },
      take: 5,
    });

    console.log('\n📊 Top 5 POs by number of linked rentals:');
    for (const po of topPOs) {
      const poDetails = await prisma.purchaseOrder.findUnique({
        where: { poId: po.poId },
        select: { poId: true, poRlseNbr: true, vendrNm: true },
      });
      console.log(
        `  PO ${poDetails?.poId} (${poDetails?.poRlseNbr}) - ${poDetails?.vendrNm}: ${po._count} rentals`
      );
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await sql.close();
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
