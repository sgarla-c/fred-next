import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const config: sql.config = {
  server: process.env.LEGACY_DB_SERVER!,
  database: 'FOD_RENTAL',
  authentication: {
    type: 'ntlm',
    options: {
      domain: process.env.LEGACY_DB_DOMAIN!,
      userName: process.env.LEGACY_DB_USER!,
      password: process.env.LEGACY_DB_PASSWORD!,
    }
  },
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function inspectTables() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');

    // Check INVC columns
    console.log('📋 INVC Table Columns:');
    const invcColumns = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'INVC'
      ORDER BY ORDINAL_POSITION
    `;
    console.table(invcColumns.recordset);

    // Sample data
    console.log('\n📊 Sample INVC Data (first 2 rows):');
    const invcSample = await sql.query`SELECT TOP 2 * FROM dbo.INVC`;
    console.log(JSON.stringify(invcSample.recordset, null, 2));

    // Check INVC_LN columns
    console.log('\n📋 INVC_LN Table Columns:');
    const invcLnColumns = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'INVC_LN'
      ORDER BY ORDINAL_POSITION
    `;
    console.table(invcLnColumns.recordset);

    // Check CLAIM columns
    console.log('\n📋 CLAIM Table Columns:');
    const claimColumns = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CLAIM'
      ORDER BY ORDINAL_POSITION
    `;
    console.table(claimColumns.recordset);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

inspectTables();
