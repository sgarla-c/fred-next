# Legacy Data Import Scripts

These scripts import data from the legacy FRED SQL Server database (FOD_RENTAL) into the new PostgreSQL database.

## Prerequisites

1. **SQL Server Access**: Ensure you have network access to the legacy FRED SQL Server database
2. **Credentials**: Add SQL Server credentials to your `.env.local` file:

```env
# SQL Server (Legacy FRED Database)
SQLSERVER_HOST=your-sqlserver-host
SQLSERVER_DATABASE=FOD_RENTAL
SQLSERVER_USER=your-username
SQLSERVER_PASSWORD=your-password
```

## Available Scripts

### Import Purchase Orders
```bash
npm run seed:po
```
Imports all PO records from the `PO` table.

### Import Rental-PO Links
```bash
npm run seed:rental-po
```
Imports rental-to-PO linkages from the `RENTAL_PO` table.

**Note**: Run this AFTER importing rentals and POs.

### Import All Legacy Data
```bash
npm run seed:all-legacy
```
Runs both PO and RENTAL_PO imports in sequence.

## Import Process

1. **Connects** to SQL Server using credentials from `.env.local`
2. **Fetches** data from legacy tables
3. **Upserts** data into PostgreSQL (updates if exists, creates if new)
4. **Reports** import statistics (imported/skipped counts)

## Data Validation

The scripts include validation:
- Checks for existing records (upsert strategy)
- Validates foreign key relationships (for RENTAL_PO links)
- Skips invalid records with warnings
- Reports detailed error messages

## Troubleshooting

### Connection Issues
- Verify SQL Server hostname and port
- Check firewall rules allow SQL Server connections (port 1433)
- Ensure SQL Server authentication is enabled

### Missing Data
- Import rentals before importing RENTAL_PO links
- Check that rental IDs and PO IDs match between databases

### Errors During Import
- Check console output for specific error messages
- Verify data types match between SQL Server and PostgreSQL
- Check for NULL constraint violations

## Running Inside Docker

```bash
# From host machine
docker compose exec app-dev npm run seed:po

# Or run all legacy imports
docker compose exec app-dev npm run seed:all-legacy
```

## Data Mapping

### PO Table
| SQL Server Column | PostgreSQL Column | Notes |
|-------------------|-------------------|-------|
| PO_ID | poId | Primary key |
| PO_RLSE_NBR | poRlseNbr | Release number |
| VENDR_NM | vendrNm | Vendor name |
| PO_STATUS | poStatus | Workflow status |
| MNTH_EQ_RATE | mnthEqRate | Monthly rate (Decimal) |
| ... | ... | All 19 columns mapped |

### RENTAL_PO Table
| SQL Server Column | PostgreSQL Column | Notes |
|-------------------|-------------------|-------|
| RENTAL_ID | rentalId | Foreign key to RENTAL |
| PO_ID | poId | Foreign key to PO |

## Next Steps

After importing legacy data:
1. Verify record counts match expected values
2. Test PO-Rental linkages in the UI
3. Check vendor names populated correctly
4. Validate status values are consistent
