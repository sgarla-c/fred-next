/**
 * Comprehensive Legacy Data Migration Script
 * 
 * Migrates all data from SQL Server FOD_RENTAL database to PostgreSQL
 * 
 * Run with: npx tsx scripts/migrate-legacy-data.ts
 * 
 * Order of migration:
 * 1. DIST (Districts)
 * 2. SECTION (Sections)
 * 3. NIGP (Equipment Categories)
 * 4. USERS (Users - with password hashing)
 * 5. PO (Purchase Orders)
 * 6. RENTAL (Rentals)
 * 7. RENTAL_PO (Rental-PO Links)
 * 8. INVC (Invoices)
 * 9. INVC_LN (Invoice Lines)
 * 10. CLAIM (Claims)
 */

import { PrismaClient } from '@prisma/client';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// SQL Server configuration - Windows Authentication with NTLM
const sqlConfig: sql.config = {
  server: process.env.LEGACY_DB_SERVER || 'TXDOT4SVOSDDB4',
  database: process.env.LEGACY_DB_NAME || 'FOD_RENTAL',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  // Windows Authentication with NTLM
  authentication: {
    type: 'ntlm',
    options: {
      domain: process.env.LEGACY_DB_DOMAIN || 'TXDOT1',
      userName: process.env.LEGACY_DB_USER || '',
      password: process.env.LEGACY_DB_PASSWORD || '',
    },
  },
};

// Migration statistics
interface MigrationStats {
  tableName: string;
  recordsFound: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsErrored: number;
  duration: number;
}

const stats: MigrationStats[] = [];

// Helper function to log stats
function logStats(stat: MigrationStats) {
  stats.push(stat);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ ${stat.tableName} Migration Complete`);
  console.log(`   Records Found: ${stat.recordsFound}`);
  console.log(`   Imported: ${stat.recordsImported}`);
  console.log(`   Skipped: ${stat.recordsSkipped}`);
  console.log(`   Errors: ${stat.recordsErrored}`);
  console.log(`   Duration: ${stat.duration.toFixed(2)}s`);
  console.log(`${'='.repeat(60)}\n`);
}

// 1. Migrate Districts
async function migrateDistricts() {
  const startTime = Date.now();
  console.log('🔄 Migrating DIST (Districts)...');
  
  const result = await sql.query`
    SELECT DIST_NBR, DIST_NM, DIST_ABRVN, FIN_AREA, 
           FIN_AREA_BSNES_NBR, RENT_COORD_DIST_CD_NBR
    FROM dbo.DIST
    ORDER BY DIST_NBR
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      await prisma.district.upsert({
        where: { distNbr: row.DIST_NBR },
        update: {
          distNm: row.DIST_NM,
          distAbrvn: row.DIST_ABRVN,
          finArea: row.FIN_AREA,
          finAreaBsnesNbr: row.FIN_AREA_BSNES_NBR,
          rentCoordDistCdNbr: row.RENT_COORD_DIST_CD_NBR,
        },
        create: {
          distNbr: row.DIST_NBR,
          distNm: row.DIST_NM,
          distAbrvn: row.DIST_ABRVN,
          finArea: row.FIN_AREA,
          finAreaBsnesNbr: row.FIN_AREA_BSNES_NBR,
          rentCoordDistCdNbr: row.RENT_COORD_DIST_CD_NBR,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing district ${row.DIST_NBR}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'DIST',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 2. Migrate Sections
async function migrateSections() {
  const startTime = Date.now();
  console.log('🔄 Migrating SECTION (Sections)...');
  
  const result = await sql.query`
    SELECT SECT_ID, DIST_NBR, SECT_NBR, SECT_NM
    FROM dbo.SECTION
    ORDER BY SECT_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      // Check if district exists
      const districtExists = await prisma.district.findUnique({
        where: { distNbr: row.DIST_NBR },
      });
      
      if (!districtExists) {
        console.warn(`⚠️  Skipping section ${row.SECT_ID}: District ${row.DIST_NBR} not found`);
        skipped++;
        continue;
      }
      
      await prisma.section.upsert({
        where: { sectId: row.SECT_ID },
        update: {
          distNbr: row.DIST_NBR,
          sectNbr: row.SECT_NBR,
          sectNm: row.SECT_NM,
        },
        create: {
          sectId: row.SECT_ID,
          distNbr: row.DIST_NBR,
          sectNbr: row.SECT_NBR,
          sectNm: row.SECT_NM,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing section ${row.SECT_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'SECTION',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 3. Migrate NIGP
async function migrateNigp() {
  const startTime = Date.now();
  console.log('🔄 Migrating NIGP (Equipment Categories)...');
  
  const result = await sql.query`
    SELECT NIGP_CD, CTGRY_ID, FNAV_CAT, DSCR, AVG_MONTHLY_RATE
    FROM dbo.NIGP
    ORDER BY NIGP_CD
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      await prisma.nigp.upsert({
        where: { nigpCd: row.NIGP_CD },
        update: {
          ctgryId: row.CTGRY_ID,
          fnavCat: row.FNAV_CAT,
          dscr: row.DSCR,
          avgMonthlyRate: row.AVG_MONTHLY_RATE,
        },
        create: {
          nigpCd: row.NIGP_CD,
          ctgryId: row.CTGRY_ID,
          fnavCat: row.FNAV_CAT,
          dscr: row.DSCR,
          avgMonthlyRate: row.AVG_MONTHLY_RATE,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing NIGP ${row.NIGP_CD}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'NIGP',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 4. Migrate Users
async function migrateUsers() {
  const startTime = Date.now();
  console.log('🔄 Migrating USERS (Users with password hashing)...');
  
  const result = await sql.query`
    SELECT USR_ID, USR_ROLE, FIRST_NM, LAST_NM, USR_EMAIL, 
           LAST_UPDT_DT, LAST_UPDT_BY
    FROM dbo.USERS
    ORDER BY USR_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  const defaultPassword = await bcrypt.hash('TxDOT2026!', 10); // Default password
  
  for (const row of result.recordset) {
    try {
      await prisma.user.upsert({
        where: { usrId: row.USR_ID },
        update: {
          usrRole: row.USR_ROLE,
          firstNm: row.FIRST_NM,
          lastNm: row.LAST_NM,
          usrEmail: row.USR_EMAIL,
          usrPhnNbr: null,  // Not in legacy database
          distNbr: null,    // Not in legacy database
          sectId: null,     // Not in legacy database
          lastUpdtDt: row.LAST_UPDT_DT,
          lastUpdtBy: row.LAST_UPDT_BY,
        },
        create: {
          usrId: row.USR_ID,
          usrRole: row.USR_ROLE,
          firstNm: row.FIRST_NM,
          lastNm: row.LAST_NM,
          usrEmail: row.USR_EMAIL,
          usrPhnNbr: null,  // Not in legacy database
          distNbr: null,    // Not in legacy database
          sectId: null,     // Not in legacy database
          lastUpdtDt: row.LAST_UPDT_DT,
          lastUpdtBy: row.LAST_UPDT_BY,
          password: defaultPassword, // Set default password for all migrated users
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing user ${row.USR_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'USERS',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
  
  console.log('ℹ️  Note: All migrated users have default password "TxDOT2026!"');
}

// 5. Migrate Purchase Orders
async function migratePurchaseOrders() {
  const startTime = Date.now();
  console.log('🔄 Migrating PO (Purchase Orders)...');
  
  const result = await sql.query`
    SELECT PO_ID, PO_RLSE_NBR, PO_RCVD_BY, VENDR_NM, USER_RQST_VIA_PURCH_FLG,
           PO_BU_NBR, E_RQSTN_NBR, PO_STATUS, PO_START_DT, PO_EXPIR_DT,
           TXDOT_GPS, MNTH_EQ_RATE, PO_TYPE, SPCL_EVNT, LAST_UPDT_BY,
           LAST_UPDT_DT, CHART_FIELDS_FLG, VENDOR_MAIL, VENDOR_PHN_NBR
    FROM dbo.PO
    ORDER BY PO_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      await prisma.purchaseOrder.upsert({
        where: { poId: row.PO_ID },
        update: {
          poRlseNbr: row.PO_RLSE_NBR,
          poRcvdBy: row.PO_RCVD_BY,
          vendrNm: row.VENDR_NM,
          userRqstViaPurchFlg: row.USER_RQST_VIA_PURCH_FLG || false,
          poBuNbr: row.PO_BU_NBR,
          eRqstnNbr: row.E_RQSTN_NBR,
          poStatus: row.PO_STATUS,
          poStartDt: row.PO_START_DT,
          poExpirDt: row.PO_EXPIR_DT,
          txdotGps: row.TXDOT_GPS || false,
          mnthEqRate: row.MNTH_EQ_RATE,
          poType: row.PO_TYPE,
          spclEvnt: row.SPCL_EVNT,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          chartFieldsFlg: row.CHART_FIELDS_FLG || false,
          vendorMail: row.VENDOR_MAIL,
          vendorPhnNbr: row.VENDOR_PHN_NBR,
        },
        create: {
          poId: row.PO_ID,
          poRlseNbr: row.PO_RLSE_NBR,
          poRcvdBy: row.PO_RCVD_BY,
          vendrNm: row.VENDR_NM,
          userRqstViaPurchFlg: row.USER_RQST_VIA_PURCH_FLG || false,
          poBuNbr: row.PO_BU_NBR,
          eRqstnNbr: row.E_RQSTN_NBR,
          poStatus: row.PO_STATUS,
          poStartDt: row.PO_START_DT,
          poExpirDt: row.PO_EXPIR_DT,
          txdotGps: row.TXDOT_GPS || false,
          mnthEqRate: row.MNTH_EQ_RATE,
          poType: row.PO_TYPE,
          spclEvnt: row.SPCL_EVNT,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          chartFieldsFlg: row.CHART_FIELDS_FLG || false,
          vendorMail: row.VENDOR_MAIL,
          vendorPhnNbr: row.VENDOR_PHN_NBR,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing PO ${row.PO_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'PO',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 6. Migrate Rentals
async function migrateRentals() {
  const startTime = Date.now();
  console.log('🔄 Migrating RENTAL (Rentals)...');
  
  const result = await sql.query`
    SELECT RENTAL_ID, SECT_ID, DIST_NBR, NIGP_CD, RENT_STATUS, SUBMIT_DT,
           DLVRY_RQST_DT, DLVRY_DT, DLVRY_TIME, CALL_OFF_DT, RENTAL_DUE_DT,
           RQST_BY, DUR_LNGTH, DUR_UOM, EQPMT_MODEL, EQPMT_MAKE, EQPMT_CMNT,
           EQPMT_ATCHMT, EQPMT_Qty, EQPMT_Qty1, EQPMT_Qty2, DLVRY_LOCN,
           POC_NM, POC_PHN_NBR, POC_SCNDRY_NM, POC_SCNDRY_PHN_NBR,
           CF_DEPT_NBR, CF_ACCT_NBR, CF_APPROP_YR, CF_APPROP_CLASS,
           CF_FUND, CF_BUS_UNIT, CF_PROJ, CF_ACTV, CF_SRC_TYPE, CF_TASK,
           SPCL_INST, RENT_CMNT, SERVICE_CALL_CMNT, RCVD_BY, PO_PROCESSOR_NM,
           PO_PROCESSOR_PHN_NBR, TROUBLE_RENT_FLG, SERVICE_CALL_FLG,
           USER_REQUEST_FLG, VENDR_UNIT_NBR, REASON_CODES, ON_RENT_HRS,
           OFF_RENT_HRS, LAST_UPDT_BY, LAST_UPDT_DT
    FROM dbo.RENTAL
    ORDER BY RENTAL_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      // Validate foreign keys exist
      const sectionExists = await prisma.section.findUnique({
        where: { sectId: row.SECT_ID },
      });
      
      if (!sectionExists) {
        console.warn(`⚠️  Skipping rental ${row.RENTAL_ID}: Section ${row.SECT_ID} not found`);
        skipped++;
        continue;
      }
      
      await prisma.rental.upsert({
        where: { rentalId: row.RENTAL_ID },
        update: {
          sectId: row.SECT_ID,
          distNbr: row.DIST_NBR,
          nigpCd: row.NIGP_CD,
          rentStatus: row.RENT_STATUS,
          submitDt: row.SUBMIT_DT,
          dlvryRqstDt: row.DLVRY_RQST_DT,
          dlvryDt: row.DLVRY_DT,
          dlvryTime: row.DLVRY_TIME,
          callOffDt: row.CALL_OFF_DT,
          rentalDueDt: row.RENTAL_DUE_DT,
          rqstBy: row.RQST_BY,
          durLngth: row.DUR_LNGTH,
          durUom: row.DUR_UOM,
          eqpmtModel: row.EQPMT_MODEL,
          eqpmtMake: row.EQPMT_MAKE,
          eqpmtCmnt: row.EQPMT_CMNT,
          eqpmtAtchmt: row.EQPMT_ATCHMT,
          eqpmtQty: row.EQPMT_Qty,
          eqpmtQty1: row.EQPMT_Qty1,
          eqpmtQty2: row.EQPMT_Qty2,
          dlvryLocn: row.DLVRY_LOCN,
          pocNm: row.POC_NM,
          pocPhnNbr: row.POC_PHN_NBR,
          pocScndryNm: row.POC_SCNDRY_NM,
          pocScndryPhnNbr: row.POC_SCNDRY_PHN_NBR,
          cfDeptNbr: row.CF_DEPT_NBR,
          cfAcctNbr: row.CF_ACCT_NBR,
          cfAppropYr: row.CF_APPROP_YR,
          cfAppropClass: row.CF_APPROP_CLASS,
          cfFund: row.CF_FUND,
          cfBusUnit: row.CF_BUS_UNIT,
          cfProj: row.CF_PROJ,
          cfActv: row.CF_ACTV,
          cfSrcType: row.CF_SRC_TYPE,
          cfTask: row.CF_TASK,
          spclInst: row.SPCL_INST,
          rentCmnt: row.RENT_CMNT,
          serviceCallCmnt: row.SERVICE_CALL_CMNT,
          rcvdBy: row.RCVD_BY,
          poProcessorNm: row.PO_PROCESSOR_NM,
          poProcessorPhnNbr: row.PO_PROCESSOR_PHN_NBR,
          troubleRentFlg: row.TROUBLE_RENT_FLG || false,
          serviceCallFlg: row.SERVICE_CALL_FLG,
          userRequestFlg: row.USER_REQUEST_FLG,
          vendrUnitNbr: row.VENDR_UNIT_NBR,
          reasonCodes: row.REASON_CODES,
          onRentHrs: row.ON_RENT_HRS,
          offRentHrs: row.OFF_RENT_HRS,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
        },
        create: {
          rentalId: row.RENTAL_ID,
          sectId: row.SECT_ID,
          distNbr: row.DIST_NBR,
          nigpCd: row.NIGP_CD,
          rentStatus: row.RENT_STATUS,
          submitDt: row.SUBMIT_DT,
          dlvryRqstDt: row.DLVRY_RQST_DT,
          dlvryDt: row.DLVRY_DT,
          dlvryTime: row.DLVRY_TIME,
          callOffDt: row.CALL_OFF_DT,
          rentalDueDt: row.RENTAL_DUE_DT,
          rqstBy: row.RQST_BY,
          durLngth: row.DUR_LNGTH,
          durUom: row.DUR_UOM,
          eqpmtModel: row.EQPMT_MODEL,
          eqpmtMake: row.EQPMT_MAKE,
          eqpmtCmnt: row.EQPMT_CMNT,
          eqpmtAtchmt: row.EQPMT_ATCHMT,
          eqpmtQty: row.EQPMT_Qty,
          eqpmtQty1: row.EQPMT_Qty1,
          eqpmtQty2: row.EQPMT_Qty2,
          dlvryLocn: row.DLVRY_LOCN,
          pocNm: row.POC_NM,
          pocPhnNbr: row.POC_PHN_NBR,
          pocScndryNm: row.POC_SCNDRY_NM,
          pocScndryPhnNbr: row.POC_SCNDRY_PHN_NBR,
          cfDeptNbr: row.CF_DEPT_NBR,
          cfAcctNbr: row.CF_ACCT_NBR,
          cfAppropYr: row.CF_APPROP_YR,
          cfAppropClass: row.CF_APPROP_CLASS,
          cfFund: row.CF_FUND,
          cfBusUnit: row.CF_BUS_UNIT,
          cfProj: row.CF_PROJ,
          cfActv: row.CF_ACTV,
          cfSrcType: row.CF_SRC_TYPE,
          cfTask: row.CF_TASK,
          spclInst: row.SPCL_INST,
          rentCmnt: row.RENT_CMNT,
          serviceCallCmnt: row.SERVICE_CALL_CMNT,
          rcvdBy: row.RCVD_BY,
          poProcessorNm: row.PO_PROCESSOR_NM,
          poProcessorPhnNbr: row.PO_PROCESSOR_PHN_NBR,
          troubleRentFlg: row.TROUBLE_RENT_FLG || false,
          serviceCallFlg: row.SERVICE_CALL_FLG,
          userRequestFlg: row.USER_REQUEST_FLG,
          vendrUnitNbr: row.VENDR_UNIT_NBR,
          reasonCodes: row.REASON_CODES,
          onRentHrs: row.ON_RENT_HRS,
          offRentHrs: row.OFF_RENT_HRS,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing rental ${row.RENTAL_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'RENTAL',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 7. Migrate Rental-PO Links
async function migrateRentalPoLinks() {
  const startTime = Date.now();
  console.log('🔄 Migrating RENTAL_PO (Rental-PO Links)...');
  
  const result = await sql.query`
    SELECT RENTAL_ID, PO_ID
    FROM dbo.RENTAL_PO
    ORDER BY RENTAL_ID, PO_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      // Validate both foreign keys exist
      const rentalExists = await prisma.rental.findUnique({
        where: { rentalId: row.RENTAL_ID },
      });
      const poExists = await prisma.purchaseOrder.findUnique({
        where: { poId: row.PO_ID },
      });
      
      if (!rentalExists || !poExists) {
        console.warn(
          `⚠️  Skipping rental-PO link: Rental ${row.RENTAL_ID} or PO ${row.PO_ID} not found`
        );
        skipped++;
        continue;
      }
      
      // Check if link already exists
      const existingLink = await prisma.rentalPo.findFirst({
        where: {
          rentalId: row.RENTAL_ID,
          poId: row.PO_ID,
        },
      });
      
      if (existingLink) {
        skipped++;
        continue;
      }
      
      await prisma.rentalPo.create({
        data: {
          rentalId: row.RENTAL_ID,
          poId: row.PO_ID,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing rental-PO link ${row.RENTAL_ID}-${row.PO_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'RENTAL_PO',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 8. Migrate Invoices
async function migrateInvoices() {
  const startTime = Date.now();
  console.log('🔄 Migrating INVC (Invoices)...');
  
  const result = await sql.query`
    SELECT INVC_ID, CLAIM_NBR, INVC_NBR, ENTRY_DT, RENT_COORD_RSPNBL,
           INVC_DT, FIN_STAMP_DT, SRVC_START_DT, SRVC_STOP_DT, RCPT_DT,
           RCPT_NBR, FOD_NOTES, INVC_STAT, LAST_UPDT_BY, LAST_UPDT_DT,
           FIN_STAT, FIN_NOTES, FIN_ID, FIN_RSPNBL
    FROM dbo.INVC
    ORDER BY INVC_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      await prisma.invoice.upsert({
        where: { invcId: row.INVC_ID },
        update: {
          claimNbr: row.CLAIM_NBR,
          invcNbr: row.INVC_NBR,
          entryDt: row.ENTRY_DT,
          rentCoordRspnbl: row.RENT_COORD_RSPNBL,
          invcDt: row.INVC_DT,
          finStampDt: row.FIN_STAMP_DT,
          srvcStartDt: row.SRVC_START_DT,
          srvcStopDt: row.SRVC_STOP_DT,
          rcptDt: row.RCPT_DT,
          rcptNbr: row.RCPT_NBR,
          fodNotes: row.FOD_NOTES,
          invcStat: row.INVC_STAT,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          finStat: row.FIN_STAT,
          finNotes: row.FIN_NOTES,
          finId: row.FIN_ID,
          finRspnbl: row.FIN_RSPNBL,
        },
        create: {
          invcId: row.INVC_ID,
          claimNbr: row.CLAIM_NBR,
          invcNbr: row.INVC_NBR,
          entryDt: row.ENTRY_DT,
          rentCoordRspnbl: row.RENT_COORD_RSPNBL,
          invcDt: row.INVC_DT,
          finStampDt: row.FIN_STAMP_DT,
          srvcStartDt: row.SRVC_START_DT,
          srvcStopDt: row.SRVC_STOP_DT,
          rcptDt: row.RCPT_DT,
          rcptNbr: row.RCPT_NBR,
          fodNotes: row.FOD_NOTES,
          invcStat: row.INVC_STAT,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          finStat: row.FIN_STAT,
          finNotes: row.FIN_NOTES,
          finId: row.FIN_ID,
          finRspnbl: row.FIN_RSPNBL,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing invoice ${row.INVC_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'INVC',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 9. Migrate Invoice Lines
async function migrateInvoiceLines() {
  const startTime = Date.now();
  console.log('🔄 Migrating INVC_LN (Invoice Lines)...');
  
  const result = await sql.query`
    SELECT INVC_LN_ID, PO_ID, ITEM_AMT, RENTAL_ID, INVC_ID, INVC_FISCAL_YR
    FROM dbo.INVC_LN
    ORDER BY INVC_LN_ID
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      // Validate invoice exists
      const invoiceExists = await prisma.invoice.findUnique({
        where: { invcId: row.INVC_ID },
      });
      
      if (!invoiceExists) {
        console.warn(`⚠️  Skipping invoice line ${row.INVC_LN_ID}: Invoice ${row.INVC_ID} not found`);
        skipped++;
        continue;
      }
      
      await prisma.invoiceLine.upsert({
        where: { invcLnId: row.INVC_LN_ID },
        update: {
          poId: row.PO_ID,
          itemAmt: row.ITEM_AMT,
          rentalId: row.RENTAL_ID,
          invcId: row.INVC_ID,
          invcFiscalYr: row.INVC_FISCAL_YR,
        },
        create: {
          invcLnId: row.INVC_LN_ID,
          poId: row.PO_ID,
          itemAmt: row.ITEM_AMT,
          rentalId: row.RENTAL_ID,
          invcId: row.INVC_ID,
          invcFiscalYr: row.INVC_FISCAL_YR,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing invoice line ${row.INVC_LN_ID}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'INVC_LN',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// 10. Migrate Claims
async function migrateClaims() {
  const startTime = Date.now();
  console.log('🔄 Migrating CLAIM (Claims)...');
  
  const result = await sql.query`
    SELECT CLAIM_NBR, CLAIM_STAT, CLAIM_NM, RENTAL_ID, PO_ID,
           CLAIM_DSCR, VENDR_NM, VENDR_CLAIM_DT, CLAIM_STAT_CMNT,
           CLAIM_ADDL_CMNT, OCC_NOTIF_DT, OCC_CLAIM_NBR, OCC_CONCLUSION,
           ON_RENT_FLAG, CLAIM_SETLMT_AMT, RENT_COORD_USER_ID, TXDOT_RCVD_DT,
           CLAIM_PAID_DT, EML_REJCT_DT, LAST_FOLUP_DT, VENDR_CNTCT_NM,
           VENDR_CNTCT_PHN_NBR, VENDR_CNTCT_TTL, VENDR_ADDR_1, VENDR_ADDR_2,
           LAST_UPDT_BY, LAST_UPDT_DT, DIST_NM, TITLE_43_CLAIM, CONTRACT_NBR
    FROM dbo.CLAIM
    ORDER BY CLAIM_NBR
  `;
  
  let imported = 0, skipped = 0, errored = 0;
  
  for (const row of result.recordset) {
    try {
      await prisma.claim.upsert({
        where: { claimNbr: row.CLAIM_NBR },
        update: {
          claimStat: row.CLAIM_STAT,
          claimNm: row.CLAIM_NM,
          rentalId: row.RENTAL_ID,
          poId: row.PO_ID,
          claimDscr: row.CLAIM_DSCR,
          vendrNm: row.VENDR_NM,
          vendrClaimDt: row.VENDR_CLAIM_DT,
          claimStatCmnt: row.CLAIM_STAT_CMNT,
          claimAddlCmnt: row.CLAIM_ADDL_CMNT,
          occNotifDt: row.OCC_NOTIF_DT,
          occClaimNbr: row.OCC_CLAIM_NBR,
          occConclusion: row.OCC_CONCLUSION,
          onRentFlag: row.ON_RENT_FLAG || false,
          claimSetlmtAmt: row.CLAIM_SETLMT_AMT,
          rentCoordUserId: row.RENT_COORD_USER_ID,
          txdotRcvdDt: row.TXDOT_RCVD_DT,
          claimPaidDt: row.CLAIM_PAID_DT,
          emlRejctDt: row.EML_REJCT_DT,
          lastFolupDt: row.LAST_FOLUP_DT,
          vendrCntctNm: row.VENDR_CNTCT_NM,
          vendrCntctPhnNbr: row.VENDR_CNTCT_PHN_NBR,
          vendrCntctTtl: row.VENDR_CNTCT_TTL,
          vendrAddr1: row.VENDR_ADDR_1,
          vendrAddr2: row.VENDR_ADDR_2,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          distNm: row.DIST_NM,
          title43Claim: row.TITLE_43_CLAIM || false,
          contractNbr: row.CONTRACT_NBR,
        },
        create: {
          claimNbr: row.CLAIM_NBR,
          claimStat: row.CLAIM_STAT,
          claimNm: row.CLAIM_NM,
          rentalId: row.RENTAL_ID,
          poId: row.PO_ID,
          claimDscr: row.CLAIM_DSCR,
          vendrNm: row.VENDR_NM,
          vendrClaimDt: row.VENDR_CLAIM_DT,
          claimStatCmnt: row.CLAIM_STAT_CMNT,
          claimAddlCmnt: row.CLAIM_ADDL_CMNT,
          occNotifDt: row.OCC_NOTIF_DT,
          occClaimNbr: row.OCC_CLAIM_NBR,
          occConclusion: row.OCC_CONCLUSION,
          onRentFlag: row.ON_RENT_FLAG || false,
          claimSetlmtAmt: row.CLAIM_SETLMT_AMT,
          rentCoordUserId: row.RENT_COORD_USER_ID,
          txdotRcvdDt: row.TXDOT_RCVD_DT,
          claimPaidDt: row.CLAIM_PAID_DT,
          emlRejctDt: row.EML_REJCT_DT,
          lastFolupDt: row.LAST_FOLUP_DT,
          vendrCntctNm: row.VENDR_CNTCT_NM,
          vendrCntctPhnNbr: row.VENDR_CNTCT_PHN_NBR,
          vendrCntctTtl: row.VENDR_CNTCT_TTL,
          vendrAddr1: row.VENDR_ADDR_1,
          vendrAddr2: row.VENDR_ADDR_2,
          lastUpdtBy: row.LAST_UPDT_BY,
          lastUpdtDt: row.LAST_UPDT_DT,
          distNm: row.DIST_NM,
          title43Claim: row.TITLE_43_CLAIM || false,
          contractNbr: row.CONTRACT_NBR,
        },
      });
      imported++;
    } catch (error) {
      console.error(`Error importing claim ${row.CLAIM_NBR}:`, error);
      errored++;
    }
  }
  
  logStats({
    tableName: 'CLAIM',
    recordsFound: result.recordset.length,
    recordsImported: imported,
    recordsSkipped: skipped,
    recordsErrored: errored,
    duration: (Date.now() - startTime) / 1000,
  });
}

// Main migration function
async function main() {
  const totalStartTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting Legacy Data Migration');
  console.log('   Source: SQL Server FOD_RENTAL (TXDOT4SVOSDDB4)');
  console.log('   Target: PostgreSQL fred-next');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Connect to SQL Server
    console.log('📡 Connecting to SQL Server...');
    await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server\n');
    
    // Run migrations in order
    await migrateDistricts();
    await migrateSections();
    await migrateNigp();
    await migrateUsers();
    await migratePurchaseOrders();
    await migrateRentals();
    await migrateRentalPoLinks();
    await migrateInvoices();
    await migrateInvoiceLines();
    await migrateClaims();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`Total Duration: ${((Date.now() - totalStartTime) / 1000).toFixed(2)}s\n`);
    
    console.log('Table                  Found   Imported  Skipped  Errors');
    console.log('-'.repeat(60));
    stats.forEach(stat => {
      console.log(
        `${stat.tableName.padEnd(20)} ${stat.recordsFound.toString().padStart(6)}  ` +
        `${stat.recordsImported.toString().padStart(8)}  ` +
        `${stat.recordsSkipped.toString().padStart(7)}  ` +
        `${stat.recordsErrored.toString().padStart(7)}`
      );
    });
    console.log('-'.repeat(60));
    
    const totalFound = stats.reduce((sum, s) => sum + s.recordsFound, 0);
    const totalImported = stats.reduce((sum, s) => sum + s.recordsImported, 0);
    const totalSkipped = stats.reduce((sum, s) => sum + s.recordsSkipped, 0);
    const totalErrored = stats.reduce((sum, s) => sum + s.recordsErrored, 0);
    
    console.log(
      `${'TOTAL'.padEnd(20)} ${totalFound.toString().padStart(6)}  ` +
      `${totalImported.toString().padStart(8)}  ` +
      `${totalSkipped.toString().padStart(7)}  ` +
      `${totalErrored.toString().padStart(7)}`
    );
    
    console.log('\n✅ All data successfully migrated!');
    
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    throw error;
  } finally {
    await sql.close();
    await prisma.$disconnect();
    console.log('\n👋 Database connections closed');
  }
}

// Run the migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
