/**
 * Test SQL Server Connection
 * 
 * Quick script to verify SQL Server credentials and connection
 * 
 * Run with: npx tsx scripts/test-sqlserver-connection.ts
 */

import sql from 'mssql';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// SQL Server configuration
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

async function testConnection() {
  console.log('\n========================================');
  console.log('🔍 Testing SQL Server Connection');
  console.log('========================================\n');
  
  console.log('Configuration:');
  console.log(`  Server: ${sqlConfig.server}`);
  console.log(`  Database: ${sqlConfig.database}`);
  console.log(`  Domain: ${process.env.LEGACY_DB_DOMAIN}`);
  console.log(`  Username: ${process.env.LEGACY_DB_USER}`);
  console.log(`  Auth Type: Windows (NTLM)\n`);
  
  try {
    console.log('📡 Attempting to connect...');
    await sql.connect(sqlConfig);
    console.log('✅ Connected successfully!\n');
    
    // Test query - get table counts
    console.log('📊 Fetching table statistics...\n');
    const result = await sql.query`
      SELECT 
        (SELECT COUNT(*) FROM DIST) as dist_count,
        (SELECT COUNT(*) FROM SECTION) as section_count,
        (SELECT COUNT(*) FROM NIGP) as nigp_count,
        (SELECT COUNT(*) FROM USERS) as users_count,
        (SELECT COUNT(*) FROM PO) as po_count,
        (SELECT COUNT(*) FROM RENTAL) as rental_count,
        (SELECT COUNT(*) FROM RENTAL_PO) as rental_po_count,
        (SELECT COUNT(*) FROM INVC) as invc_count,
        (SELECT COUNT(*) FROM INVC_LN) as invc_ln_count,
        (SELECT COUNT(*) FROM CLAIM) as claim_count
    `;
    
    const counts = result.recordset[0];
    
    console.log('Table                    Record Count');
    console.log('─'.repeat(45));
    console.log(`DIST (Districts)         ${counts.dist_count.toString().padStart(12)}`);
    console.log(`SECTION                  ${counts.section_count.toString().padStart(12)}`);
    console.log(`NIGP                     ${counts.nigp_count.toString().padStart(12)}`);
    console.log(`USERS                    ${counts.users_count.toString().padStart(12)}`);
    console.log(`PO (Purchase Orders)     ${counts.po_count.toString().padStart(12)}`);
    console.log(`RENTAL                   ${counts.rental_count.toString().padStart(12)}`);
    console.log(`RENTAL_PO (Links)        ${counts.rental_po_count.toString().padStart(12)}`);
    console.log(`INVC (Invoices)          ${counts.invc_count.toString().padStart(12)}`);
    console.log(`INVC_LN (Invoice Lines)  ${counts.invc_ln_count.toString().padStart(12)}`);
    console.log(`CLAIM                    ${counts.claim_count.toString().padStart(12)}`);
    console.log('─'.repeat(45));
    
    const total = Object.values(counts).reduce((sum: number, val) => sum + (val as number), 0);
    console.log(`TOTAL RECORDS            ${total.toString().padStart(12)}\n`);
    
    // Test a sample query
    console.log('🔍 Testing USERS table structure...');
    const usersColsResult = await sql.query`
      SELECT TOP 1 * FROM USERS
    `;
    if (usersColsResult.recordset.length > 0) {
      console.log('USERS table columns:');
      Object.keys(usersColsResult.recordset[0]).forEach((col) => {
        console.log(`  - ${col}`);
      });
    }
    
    console.log('\n🔍 Testing sample data retrieval...');
    const sampleResult = await sql.query`SELECT TOP 3 DIST_NBR, DIST_NM FROM DIST ORDER BY DIST_NBR`;
    console.log(`✅ Retrieved ${sampleResult.recordset.length} sample districts:`);
    sampleResult.recordset.forEach((row: any) => {
      console.log(`   - District ${row.DIST_NBR}: ${row.DIST_NM}`);
    });
    
    console.log('\n========================================');
    console.log('✅ Connection Test PASSED');
    console.log('========================================');
    console.log('\n✓ SQL Server connection is working correctly');
    console.log('✓ All required tables are accessible');
    console.log(`✓ Total of ${total.toLocaleString()} records ready for migration\n`);
    console.log('You can now run the full migration with:');
    console.log('  powershell -ExecutionPolicy Bypass -File .\\run-migration.ps1\n');
    
  } catch (error: any) {
    console.error('\n❌ Connection Test FAILED\n');
    
    if (error.code === 'ELOGIN') {
      console.error('Authentication Error:');
      console.error('  The username or password is incorrect.\n');
      console.error('Please check:');
      console.error('  1. Username format in .env.local: LEGACY_DB_USER="TXDOT1\\\\SGARLA-C"');
      console.error('  2. Password is correct');
      console.error('  3. Account has access to SQL Server\n');
    } else if (error.code === 'ESOCKET') {
      console.error('Network Error:');
      console.error('  Cannot reach the SQL Server.\n');
      console.error('Please check:');
      console.error('  1. Server name is correct: TXDOT4SVOSDDB4');
      console.error('  2. Network connectivity / VPN is active');
      console.error('  3. SQL Server port 1433 is accessible\n');
    } else {
      console.error('Error details:', error.message);
      if (error.originalError) {
        console.error('Original error:', error.originalError.message);
      }
    }
    
    throw error;
  } finally {
    await sql.close();
  }
}

testConnection().catch((error) => {
  process.exit(1);
});
