# Legacy Data Migration Guide

## Overview
This guide helps you migrate all data from the legacy FOD_RENTAL SQL Server database to the new PostgreSQL fred-next database.

## ⚠️ Authentication Issue & Solutions

### The Problem
Windows Authentication from Node.js (mssql package) to SQL Server requires explicit credentials, but standard Windows Auth integration doesn't work automatically.

### Solution Options

#### Option 1: Update .env.local with Your Windows Credentials (Recommended for Quick Testing)

Add your TXDOT Windows credentials to `.env.local`:

```env
LEGACY_DB_SERVER="TXDOT4SVOSDDB4"
LEGACY_DB_NAME="FOD_RENTAL"
LEGACY_DB_USER="TXDOT1\\YOUR_USERNAME"  # Replace with your actual username
LEGACY_DB_PASSWORD="your_password"      # Replace with your actual password
LEGACY_DB_DOMAIN="TXDOT1"
```

Then run:
```powershell
powershell -ExecutionPolicy Bypass -File .\run-migration.ps1
```

#### Option 2: Use SQL Server Authentication (If Available)

If the SQL Server has SQL authentication enabled and you have SQL Server credentials:

```env
LEGACY_DB_SERVER="TXDOT4SVOSDDB4"
LEGACY_DB_NAME="FOD_RENTAL"
LEGACY_DB_USER="sql_username"
LEGACY_DB_PASSWORD="sql_password"
```

#### Option 3: Manual Export/Import (Most Reliable)

Since you already have access via the MSSQL VS Code extension, you can:

1. **Export data from SQL Server** using VS Code MSSQL extension
2. **Create JSON files** for each table
3. **Import via custom seed script**

##### Step 1: Export Data Using VS Code MSSQL Extension

Run these queries in VS Code and save results as JSON:

**Export Districts:**
```sql
SELECT * FROM DIST ORDER BY DIST_NBR
```
Save as: `migration-data/districts.json`

**Export Sections:**
```sql
SELECT * FROM SECTION ORDER BY SECT_ID
```
Save as: `migration-data/sections.json`

**Export NIGP:**
```sql
SELECT * FROM NIGP ORDER BY NIGP_CD
```
Save as: `migration-data/nigp.json`

**Export Users:**
```sql
SELECT USR_ID, USR_ROLE, FIRST_NM, LAST_NM, USR_EMAIL, USR_PHN_NBR,
       DIST_NBR, SECT_ID, LAST_UPDT_DT, LAST_UPDT_BY
FROM USERS ORDER BY USR_ID
```
Save as: `migration-data/users.json`

**Export Purchase Orders:**
```sql
SELECT * FROM PO ORDER BY PO_ID
```
Save as: `migration-data/pos.json`

**Export Rentals:**
```sql
SELECT * FROM RENTAL ORDER BY RENTAL_ID
```
Save as: `migration-data/rentals.json`

**Export Rental-PO Links:**
```sql
SELECT * FROM RENTAL_PO ORDER BY RENTAL_ID, PO_ID
```
Save as: `migration-data/rental-po.json`

**Export Invoices:**
```sql
SELECT * FROM INVC ORDER BY INVC_ID
```
Save as: `migration-data/invoices.json`

**Export Invoice Lines:**
```sql
SELECT * FROM INVC_LN ORDER BY INVC_LN_ID
```
Save as: `migration-data/invoice-lines.json`

**Export Claims:**
```sql
SELECT * FROM CLAIM ORDER BY CLAIM_ID
```
Save as: `migration-data/claims.json`

##### Step 2: Run Import Script

```powershell
# From fred-next directory
npm run migrate:from-json
```

## Migration Script Files Created

1. **`scripts/migrate-legacy-data.ts`** - Comprehensive migration script (all tables)
2. **`run-migration.ps1`** - PowerShell wrapper for host-side execution
3. **`package.json`** - Added `migrate:legacy` command

## What Gets Migrated

### Core Tables (Priority 1)
- ✅ DIST → District
- ✅ SECTION → Section
- ✅ NIGP → Nigp
- ✅ USERS → User (with default password: "TxDOT2026!")
- ✅ PO → PurchaseOrder
- ✅ RENTAL → Rental
- ✅ RENTAL_PO → RentalPo

### New Tables Added to Schema
- ✅ INVC → Invoice
- ✅ INVC_LN → InvoiceLine
- ✅ CLAIM → Claim

## Migration Features

- **Upsert Strategy**: Updates existing records, creates new ones
- **Foreign Key Validation**: Skips records with missing parent records
- **Error Handling**: Continues on individual record errors
- **Progress Reporting**: Real-time progress with detailed statistics
- **Default Passwords**: All migrated users get "TxDOT2026!" password (must change on first login)

## After Migration

### Validate Data
```bash
# Check record counts
docker-compose exec app-dev npx tsx scripts/check-db.ts
```

### Test Application
1. Start the application: `npm run docker:start`
2. Access: http://localhost:3100
3. Login with migrated user credentials (password: TxDOT2026!)
4. Verify rentals, POs, invoices are visible

## Troubleshooting

### "Login failed for user" Error
- Update `.env.local` with explicit credentials (Option 1 above)
- Or use manual export/import (Option 3 above)

### "Foreign key constraint" Errors
- Migration script handles this automatically by skipping invalid records
- Check console output for skipped records

### "Connection timeout"
- Ensure TXDOT4SVOSDDB4 is accessible from your machine
- Check VPN connection if required
- Verify SQL Server port 1433 is open

### "Cannot connect to PostgreSQL"
- Ensure Docker containers are running: `docker-compose up -d`
- Check port 5432 is available: `docker ps`

## Data Counts (Expected)

Run this query on SQL Server to get expected counts:
```sql
SELECT 
  (SELECT COUNT(*) FROM DIST) as districts,
  (SELECT COUNT(*) FROM SECTION) as sections,
  (SELECT COUNT(*) FROM NIGP) as nigp_codes,
  (SELECT COUNT(*) FROM USERS) as users,
  (SELECT COUNT(*) FROM PO) as purchase_orders,
  (SELECT COUNT(*) FROM RENTAL) as rentals,
  (SELECT COUNT(*) FROM RENTAL_PO) as rental_po_links,
  (SELECT COUNT(*) FROM INVC) as invoices,
  (SELECT COUNT(*) FROM INVC_LN) as invoice_lines,
  (SELECT COUNT(*) FROM CLAIM) as claims
```

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your SQL Server connection using VS Code MSSQL extension
3. Try the manual export/import approach (Option 3) as a fallback
