# SQL Server Data Migration - Implementation Summary

## What Was Implemented

I've set up a complete data migration system to export data from your SQL Server FRED database and import it into the new PostgreSQL database.

## Files Created/Modified

### 1. Export Script
**File:** `scripts/export-sqlserver-data.js`
- Connects to SQL Server FOD_RENTAL database
- Exports 4 tables to JSON files:
  - DIST → districts.json
  - SECTION → sections.json
  - NIGP → nigp.json
  - USERS → users.json (without passwords)
- Saves to `scripts/exported-data/` folder

### 2. Updated Seed Script
**File:** `prisma/seed.ts`
- **Smart detection**: Automatically checks if exported data exists
- **Two modes**:
  1. **Production mode**: Uses real SQL Server data (if JSON files exist)
  2. **Development mode**: Uses test data (if no JSON files)
- **Default password**: All imported users get "TxDOT2026!" as password

### 3. Documentation
**File:** `DATA_MIGRATION.md`
- Step-by-step migration guide
- SQL Server connection configuration
- Troubleshooting section
- Data validation queries
- Security notes

**File:** `scripts/README.md`
- Quick reference for export scripts
- Configuration instructions

### 4. Configuration Updates
**File:** `package.json`
- Added script: `npm run export:sqlserver`

**File:** `.gitignore`
- Added `scripts/exported-data/` to prevent committing sensitive data

## How To Use

### Option 1: Export Real Data from SQL Server

1. **Install SQL Server driver:**
   ```powershell
   cd c:\Users\SGARLA-C\FRED\fred-next
   npm install mssql
   ```

2. **Configure connection** in `scripts/export-sqlserver-data.js`:
   ```javascript
   const config = {
     server: 'YOUR_SQL_SERVER_NAME',  // Ask your DBA
     database: 'FOD_RENTAL',
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

3. **Export data:**
   ```powershell
   npm run export:sqlserver
   ```

4. **Import to PostgreSQL:**
   ```powershell
   npm run prisma:seed
   ```

### Option 2: Continue Using Test Data

If you don't have access to SQL Server or want to keep testing with sample data:

```powershell
# Just run the seed script - it will use test data automatically
npm run prisma:seed
```

## What Data Gets Migrated

### Districts (DIST table)
- All 25 TxDOT districts
- District numbers, names, abbreviations
- Example: Dallas (18), Fort Worth (2), Austin (20)

### Sections (SECTION table)
- All sections per district (~150 total)
- Section IDs, numbers, names
- Linked to parent districts

### NIGP Codes (NIGP table)
- All equipment types (~200 codes)
- Descriptions and monthly rates
- Example: Excavator (06543), Bulldozer (06544)

### Users (USERS table)
- All user accounts (~45 users)
- Usernames, roles, names, emails
- **Note**: Passwords are NOT migrated (security)
- All users get default password: **TxDOT2026!**

## Current State

✅ Test data is currently loaded (5 districts, 3 sections, 10 NIGP codes, 3 users)
✅ Export script is ready to use
✅ Seed script will auto-detect real data when available
✅ Documentation is complete
✅ Security measures in place (gitignore, password exclusion)

## Next Steps

**Immediate:**
1. Decide if you want to export real data now or continue with test data
2. If exporting, get SQL Server connection details from your DBA
3. Run the export script
4. Re-seed the database

**Future:**
1. Implement password change functionality (users must change default password)
2. Add user management page (create, edit, delete users)
3. Import historical rental data (RENTAL table)
4. Migrate other lookup tables (FNAV_CTGRY, EQPMT_CTGRY, etc.)

## Technical Details

### Data Transformation

The export script transforms SQL Server naming to match PostgreSQL/Prisma naming:

| SQL Server | PostgreSQL |
|------------|------------|
| DIST_NBR   | distNbr    |
| DIST_NM    | distNm     |
| SECT_ID    | sectId     |
| USR_ID     | usrId      |
| NIGP_CD    | nigpCd     |

### Security Features

1. **Passwords excluded** from export
2. **Default password** applied to all users (must be changed)
3. **Exported data** automatically gitignored
4. **Connection credentials** not committed to Git

### Error Handling

The seed script:
- Uses `upsert` to prevent duplicate errors
- Continues on individual record failures
- Validates JSON file existence
- Falls back to test data if export missing

## Questions?

Refer to:
- **Full migration guide**: [DATA_MIGRATION.md](DATA_MIGRATION.md)
- **Export script docs**: [scripts/README.md](scripts/README.md)
- **Troubleshooting**: See DATA_MIGRATION.md "Troubleshooting" section

## Testing the Migration

After importing real data, test these scenarios:

1. **Login**: Try logging in with a real username and default password
2. **Districts**: Check that all 25 districts appear in dropdown
3. **Sections**: Select different districts and verify sections load correctly
4. **Equipment**: Verify all NIGP codes are available in the equipment dropdown
5. **Rental submission**: Create a test rental with real district/section/equipment
