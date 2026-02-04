/**
 * Seed script to import Purchase Order data from legacy FRED SQL Server database
 * 
 * Run with: npx tsx scripts/seed-po-data.ts
 * 
 * Requirements:
 * - SQL Server connection details in environment variables
 * - mssql package: npm install mssql
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
    encrypt: true, // Use encryption
    trustServerCertificate: true, // For local dev
  },
};

interface LegacyPO {
  PO_ID: number;
  PO_RLSE_NBR: string | null;
  PO_RCVD_BY: string | null;
  VENDR_NM: string | null;
  USER_RQST_VIA_PURCH_FLG: boolean;
  PO_BU_NBR: string | null;
  E_RQSTN_NBR: string | null;
  PO_STATUS: string | null;
  PO_START_DT: Date | null;
  PO_EXPIR_DT: Date | null;
  TXDOT_GPS: boolean;
  MNTH_EQ_RATE: number | null;
  PO_TYPE: string | null;
  SPCL_EVNT: string | null;
  LAST_UPDT_BY: string | null;
  LAST_UPDT_DT: Date | null;
  CHART_FIELDS_FLG: boolean;
  VENDOR_MAIL: string | null;
  VENDOR_PHN_NBR: string | null;
}

async function main() {
  console.log('🔄 Starting PO data migration from legacy database...\n');

  try {
    // Connect to SQL Server
    console.log('📡 Connecting to SQL Server...');
    await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server\n');

    // Query legacy PO data
    console.log('📊 Querying legacy PO table...');
    const result = await sql.query<LegacyPO>`
      SELECT 
        PO_ID,
        PO_RLSE_NBR,
        PO_RCVD_BY,
        VENDR_NM,
        USER_RQST_VIA_PURCH_FLG,
        PO_BU_NBR,
        E_RQSTN_NBR,
        PO_STATUS,
        PO_START_DT,
        PO_EXPIR_DT,
        TXDOT_GPS,
        MNTH_EQ_RATE,
        PO_TYPE,
        SPCL_EVNT,
        LAST_UPDT_BY,
        LAST_UPDT_DT,
        CHART_FIELDS_FLG,
        VENDOR_MAIL,
        VENDOR_PHN_NBR
      FROM dbo.PO
      ORDER BY PO_ID
    `;

    const legacyPOs = result.recordset;
    console.log(`✅ Found ${legacyPOs.length} purchase orders\n`);

    if (legacyPOs.length === 0) {
      console.log('⚠️  No purchase orders found in legacy database');
      return;
    }

    // Transform and import data
    console.log('🔄 Importing purchase orders...');
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const legacyPO of legacyPOs) {
      try {
        // Normalize status values to match new enum
        let normalizedStatus = legacyPO.PO_STATUS;
        if (normalizedStatus) {
          // Map legacy status values to new schema
          const statusMap: Record<string, string> = {
            'Draft': 'Draft',
            'Open': 'Open',
            'Active': 'Active',
            'Closed': 'Closed',
            'Cancelled': 'Cancelled',
            'Canceled': 'Cancelled', // Handle spelling variation
          };
          normalizedStatus = statusMap[normalizedStatus] || 'Draft';
        } else {
          normalizedStatus = 'Draft';
        }

        // Normalize PO type
        let normalizedType = legacyPO.PO_TYPE;
        if (normalizedType) {
          const typeMap: Record<string, string> = {
            'Equipment': 'Equipment',
            'Service': 'Service',
            'Material': 'Material',
            'Other': 'Other',
          };
          normalizedType = typeMap[normalizedType] || 'Other';
        } else {
          normalizedType = 'Other';
        }

        // Upsert purchase order
        await prisma.purchaseOrder.upsert({
          where: { poId: legacyPO.PO_ID },
          create: {
            poId: legacyPO.PO_ID,
            poRlseNbr: legacyPO.PO_RLSE_NBR,
            poRcvdBy: legacyPO.PO_RCVD_BY,
            vendrNm: legacyPO.VENDR_NM,
            userRqstViaPurchFlg: legacyPO.USER_RQST_VIA_PURCH_FLG,
            poBuNbr: legacyPO.PO_BU_NBR,
            eRqstnNbr: legacyPO.E_RQSTN_NBR,
            poStatus: normalizedStatus,
            poStartDt: legacyPO.PO_START_DT,
            poExpirDt: legacyPO.PO_EXPIR_DT,
            txdotGps: legacyPO.TXDOT_GPS,
            mnthEqRate: legacyPO.MNTH_EQ_RATE,
            poType: normalizedType,
            spclEvnt: legacyPO.SPCL_EVNT,
            lastUpdtBy: legacyPO.LAST_UPDT_BY,
            lastUpdtDt: legacyPO.LAST_UPDT_DT,
            chartFieldsFlg: legacyPO.CHART_FIELDS_FLG,
            vendorMail: legacyPO.VENDOR_MAIL,
            vendorPhnNbr: legacyPO.VENDOR_PHN_NBR,
          },
          update: {
            poRlseNbr: legacyPO.PO_RLSE_NBR,
            poRcvdBy: legacyPO.PO_RCVD_BY,
            vendrNm: legacyPO.VENDR_NM,
            userRqstViaPurchFlg: legacyPO.USER_RQST_VIA_PURCH_FLG,
            poBuNbr: legacyPO.PO_BU_NBR,
            eRqstnNbr: legacyPO.E_RQSTN_NBR,
            poStatus: normalizedStatus,
            poStartDt: legacyPO.PO_START_DT,
            poExpirDt: legacyPO.PO_EXPIR_DT,
            txdotGps: legacyPO.TXDOT_GPS,
            mnthEqRate: legacyPO.MNTH_EQ_RATE,
            poType: normalizedType,
            spclEvnt: legacyPO.SPCL_EVNT,
            lastUpdtBy: legacyPO.LAST_UPDT_BY,
            lastUpdtDt: legacyPO.LAST_UPDT_DT,
            chartFieldsFlg: legacyPO.CHART_FIELDS_FLG,
            vendorMail: legacyPO.VENDOR_MAIL,
            vendorPhnNbr: legacyPO.VENDOR_PHN_NBR,
          },
        });

        imported++;
        
        // Progress indicator
        if (imported % 100 === 0) {
          console.log(`  ✓ Imported ${imported}/${legacyPOs.length} purchase orders...`);
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Error importing PO ${legacyPO.PO_ID}:`, error);
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`  📊 Total: ${legacyPOs.length}`);
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);

    // Show some statistics
    const stats = await prisma.purchaseOrder.groupBy({
      by: ['poStatus'],
      _count: true,
    });

    console.log('\n📈 Purchase Orders by Status:');
    stats.forEach((stat) => {
      console.log(`  ${stat.poStatus}: ${stat._count}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await (sql as any).close?.();
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
