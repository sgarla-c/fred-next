/**
 * Export data from SQL Server FRED database
 * 
 * This script connects to the SQL Server database and exports data from
 * DIST, SECTION, NIGP, and USERS tables to JSON files.
 * 
 * Usage:
 * 1. Install mssql package: npm install mssql
 * 2. Update the connection config below with your SQL Server details
 * 3. Run: node scripts/export-sqlserver-data.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// SQL Server connection configuration
const config = {
  server: 'YOUR_SQL_SERVER_NAME',  // e.g., 'localhost' or 'sql-server.txdot.gov'
  database: 'FOD_RENTAL',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  // Option 1: Windows Authentication (recommended for TxDOT)
  authentication: {
    type: 'ntlm',
    options: {
      domain: 'TXDOT1',
      userName: 'YOUR_USERNAME',
      password: 'YOUR_PASSWORD'
    }
  }
  // Option 2: SQL Server Authentication
  // user: 'YOUR_USERNAME',
  // password: 'YOUR_PASSWORD'
};

// Output directory
const OUTPUT_DIR = path.join(__dirname, 'exported-data');

async function exportData() {
  try {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Connecting to SQL Server...');
    await sql.connect(config);
    console.log('Connected successfully!\n');

    // Export DIST table
    console.log('Exporting DIST table...');
    const distResult = await sql.query(`
      SELECT 
        DIST_NBR as distNbr,
        DIST_NM as distNm,
        DIST_ABRVN as distAbrvn,
        FIN_AREA as finArea,
        FIN_AREA_BSNES_NBR as finAreaBsnesNbr,
        RENT_COORD_DIST_CD_NBR as rentCoordDistCdNbr
      FROM DIST
      ORDER BY DIST_NBR
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'districts.json'),
      JSON.stringify(distResult.recordset, null, 2)
    );
    console.log(`✓ Exported ${distResult.recordset.length} districts`);

    // Export SECTION table
    console.log('Exporting SECTION table...');
    const sectionResult = await sql.query(`
      SELECT 
        SECT_ID as sectId,
        DIST_NBR as distNbr,
        SECT_NBR as sectNbr,
        SECT_NM as sectNm
      FROM SECTION
      ORDER BY DIST_NBR, SECT_ID
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'sections.json'),
      JSON.stringify(sectionResult.recordset, null, 2)
    );
    console.log(`✓ Exported ${sectionResult.recordset.length} sections`);

    // Export NIGP table
    console.log('Exporting NIGP table...');
    const nigpResult = await sql.query(`
      SELECT 
        NIGP_CD as nigpCd,
        CTGRY_ID as ctgryId,
        FNAV_CAT as fnavCat,
        DSCR as dscr,
        AVG_MONTHLY_RATE as avgMonthlyRate
      FROM NIGP
      ORDER BY NIGP_CD
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'nigp.json'),
      JSON.stringify(nigpResult.recordset, null, 2)
    );
    console.log(`✓ Exported ${nigpResult.recordset.length} NIGP codes`);

    // Export USERS table (excluding passwords for security)
    console.log('Exporting USERS table...');
    const usersResult = await sql.query(`
      SELECT 
        USR_ID as usrId,
        USR_ROLE as usrRole,
        FIRST_NM as firstNm,
        LAST_NM as lastNm,
        USR_EMAIL as usrEmail,
        LAST_UPDT_DT as lastUpdtDt,
        LAST_UPDT_BY as lastUpdtBy
      FROM USERS
      ORDER BY USR_ID
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'users.json'),
      JSON.stringify(usersResult.recordset, null, 2)
    );
    console.log(`✓ Exported ${usersResult.recordset.length} users`);

    console.log('\n✅ All data exported successfully!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review the exported JSON files');
    console.log('2. Run: npm run prisma:seed to import data into PostgreSQL');

  } catch (err) {
    console.error('❌ Error exporting data:', err);
    throw err;
  } finally {
    await sql.close();
  }
}

// Run the export
exportData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
