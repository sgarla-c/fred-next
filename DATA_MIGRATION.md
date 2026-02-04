# SQL Server to PostgreSQL Data Migration Guide

This guide explains how to export data from the legacy SQL Server FRED database and import it into the new PostgreSQL database.

## Overview

The migration process consists of two steps:
1. **Export data** from SQL Server to JSON files
2. **Import data** into PostgreSQL using the updated seed script

## Prerequisites

- Access to the SQL Server FOD_RENTAL database
- Node.js and npm installed
- All dependencies installed: `npm install`

## Step 1: Install SQL Server Driver

Install the `mssql` package to connect to SQL Server:

```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
npm install mssql
```

## Step 2: Configure SQL Server Connection

Edit `scripts/export-sqlserver-data.js` and update the connection configuration:

```javascript
const config = {
  server: 'YOUR_SQL_SERVER_NAME',  // e.g., 'TXDOT-SQL-01' or 'localhost'
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
};
```

### Finding Your SQL Server Name

You can find the SQL Server name from the Web.config file or ask your DBA. Common options:
- Internal server name (e.g., `TXDOT-SQL-PROD01`)
- Localhost if running locally
- Fully qualified domain name (e.g., `sql.txdot.gov`)

## Step 3: Export Data from SQL Server

Run the export script:

```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
node scripts/export-sqlserver-data.js
```

### What Gets Exported

The script exports data from 4 tables to JSON files in `scripts/exported-data/`:

1. **districts.json** - All TxDOT districts (DIST table)
2. **sections.json** - All sections per district (SECTION table)
3. **nigp.json** - All NIGP equipment codes (NIGP table)
4. **users.json** - All users (USERS table, without passwords)

### Expected Output

```
Connecting to SQL Server...
Connected successfully!

Exporting DIST table...
✓ Exported 25 districts
Exporting SECTION table...
✓ Exported 150 sections
Exporting NIGP table...
✓ Exported 200 NIGP codes
Exporting USERS table...
✓ Exported 45 users

✅ All data exported successfully!
📁 Data saved to: c:\Users\SGARLA-C\FRED\fred-next\scripts\exported-data
```

## Step 4: Review Exported Data

Check the JSON files in `scripts/exported-data/` to ensure data was exported correctly:

```powershell
Get-Content scripts\exported-data\districts.json | ConvertFrom-Json | Format-Table
Get-Content scripts\exported-data\sections.json | ConvertFrom-Json | Format-Table
Get-Content scripts\exported-data\users.json | ConvertFrom-Json | Format-Table
```

## Step 5: Import Data into PostgreSQL

Once the JSON files exist, the seed script will automatically use them:

```powershell
npm run prisma:seed
```

### Expected Output

```
🌱 Seeding database...
📦 Using exported data from SQL Server
✅ Created 25 districts from SQL Server
✅ Created 150 sections from SQL Server
✅ Created 200 NIGP codes from SQL Server
🔐 Hashing passwords for users...
✅ Created 45 users from SQL Server
⚠️  All users have default password: TxDOT2026!
🎉 Seed completed successfully!
```

## Default Password

**IMPORTANT**: All imported users will have the default password: `TxDOT2026!`

Users will need to:
1. Log in with their username (from USERS.USR_ID) and the default password
2. Change their password on first login (feature to be implemented)

## Using Test Data Instead

If you don't have access to the SQL Server database or want to test with sample data:

1. **Don't create** the `scripts/exported-data/` folder, or
2. Delete the existing JSON files from `scripts/exported-data/`

The seed script will automatically fall back to test data:

```
🌱 Seeding database...
🧪 Using test data (no exported data found)
✅ Created 5 districts
✅ Created 3 sections
✅ Created 10 NIGP equipment codes
✅ Created 3 test users
```

### Test Users

When using test data, these users are created:
- **testuser1** / password123 (ES role)
- **testuser2** / password123 (ES role)
- **rcuser1** / password123 (RC role)

## Troubleshooting

### Connection Errors

**Error**: `Login failed for user`
- **Solution**: Verify your username and password in the config
- Check that your account has read permissions on FOD_RENTAL database

**Error**: `Failed to connect to server`
- **Solution**: Verify the server name
- Check firewall rules allow SQL Server connections
- Ensure SQL Server is running and accepting connections

**Error**: `SSL/TLS handshake failed`
- **Solution**: Set `trustServerCertificate: true` in config

### Export Errors

**Error**: `Permission denied on object 'DIST'`
- **Solution**: Ask your DBA to grant SELECT permission on tables

**Error**: `Invalid object name 'DIST'`
- **Solution**: Verify you're connected to the FOD_RENTAL database

### Import Errors

**Error**: `File not found: districts.json`
- **Solution**: Ensure export completed successfully
- Check that JSON files exist in `scripts/exported-data/`

**Error**: `Unique constraint failed on fields: (distNbr)`
- **Solution**: Database already has data. Reset it first:
  ```powershell
  npm run prisma:migrate:reset
  npm run prisma:seed
  ```

## Data Validation

After importing, verify the data in PostgreSQL:

### Using Prisma Studio

```powershell
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse all tables.

### Using SQL Queries

```powershell
# Connect to PostgreSQL
docker exec -it fred-next-postgres-1 psql -U postgres -d fred_dev
```

Run these queries:
```sql
-- Check district count
SELECT COUNT(*) FROM "District";

-- Check section count per district
SELECT d."distNm", COUNT(s."sectId") as section_count
FROM "District" d
LEFT JOIN "Section" s ON d."distNbr" = s."distNbr"
GROUP BY d."distNm"
ORDER BY d."distNm";

-- Check user count
SELECT "usrRole", COUNT(*) 
FROM "User" 
GROUP BY "usrRole";

-- Check NIGP codes
SELECT COUNT(*) FROM "Nigp";
```

## Re-exporting Data

If you need to re-export data after changes in SQL Server:

1. Delete old files:
   ```powershell
   Remove-Item scripts\exported-data\*.json
   ```

2. Run export again:
   ```powershell
   node scripts/export-sqlserver-data.js
   ```

3. Re-seed the database:
   ```powershell
   npm run prisma:migrate:reset
   npm run prisma:seed
   ```

## Security Notes

- **Never commit** `exported-data/*.json` files to Git (already in .gitignore)
- **Never commit** SQL Server credentials
- The export script **excludes** password fields from the USERS table
- All users get a default password that must be changed on first login

## Next Steps

After successful data migration:

1. ✅ Test login with migrated users (default password: TxDOT2026!)
2. ✅ Verify all districts appear in the dropdown
3. ✅ Verify sections load correctly when selecting a district
4. ✅ Verify NIGP equipment codes are available
5. ⏭️ Implement password change functionality
6. ⏭️ Implement role-based access control
7. ⏭️ Test rental submission with real data

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the export script output for errors
3. Check PostgreSQL logs: `docker logs fred-next-postgres-1`
4. Verify JSON files are valid: `node -e "console.log(JSON.parse(require('fs').readFileSync('scripts/exported-data/districts.json')))"`
