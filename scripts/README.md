# Data Import/Export Scripts

This folder contains scripts for importing and exporting data between the legacy SQL Server database and the new PostgreSQL database.

## Import Scripts (SQL Server → PostgreSQL)

### Prerequisites for Import Scripts

1. **Install dependencies:**
   ```bash
   npm install mssql @types/mssql
   ```

2. **Configure SQL Server connection:**
   Add to your `.env` file:
   ```env
   # Legacy SQL Server Database Connection
   LEGACY_DB_SERVER=your-sqlserver-host
   LEGACY_DB_NAME=FRED_DATABASE
   LEGACY_DB_USER=your-username
   LEGACY_DB_PASSWORD=your-password
   ```

### seed-po-data.ts

Imports Purchase Order records from legacy `dbo.PO` table.

**Run:**
```bash
npm run seed:po
```

**What it does:**
- Queries all PO records from SQL Server
- Normalizes status (Draft/Open/Active/Closed/Cancelled)
- Normalizes PO type (Equipment/Service/Material/Other)
- Upserts into PostgreSQL PurchaseOrder table
- Shows statistics by status

### seed-rental-po-links.ts

Imports Rental-PO relationships from legacy `dbo.RENTAL_PO` table.

**Run:**
```bash
npm run seed:rental-po
```

**Important:** Run AFTER `seed:po` to ensure POs exist.

**What it does:**
- Queries Rental-PO links from SQL Server
- Validates both Rental and PO exist
- Upserts into PostgreSQL RentalPo junction table
- Shows top POs by rental count

### Run All Import Scripts

```bash
npm run seed:all
```

Executes both import scripts in sequence.

---

## Export Scripts (SQL Server → JSON)

### export-sqlserver-data.js

Exports data from the SQL Server FOD_RENTAL database to JSON files.

**Usage:**
```bash
# Install mssql package first
npm install mssql

# Configure your SQL Server connection in the script
# Then run:
npm run export:sqlserver
```

**What it exports:**
- DIST table → `exported-data/districts.json`
- SECTION table → `exported-data/sections.json`
- NIGP table → `exported-data/nigp.json`
- USERS table → `exported-data/users.json` (without passwords)

**Output location:** `scripts/exported-data/`

## Configuration

Before running the export script, update the connection config in `export-sqlserver-data.js`:

```javascript
const config = {
  server: 'YOUR_SQL_SERVER_NAME',
  database: 'FOD_RENTAL',
  // Use Windows Authentication (recommended)
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

## After Export

Once the JSON files are created in `scripts/exported-data/`, run the seed script:

```bash
npm run prisma:seed
```

The seed script will automatically detect the exported data and use it instead of test data.

## See Also

- [DATA_MIGRATION.md](../DATA_MIGRATION.md) - Complete migration guide
- [prisma/seed.ts](../prisma/seed.ts) - Import script that reads the JSON files
