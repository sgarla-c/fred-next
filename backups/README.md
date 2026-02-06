# Database Backups

This directory contains local backups of your FRED application database.

## 📁 Backup Types

- **SQL Dumps** (`backup_*.sql`) - Full PostgreSQL database dumps that can be restored
- **JSON Exports** (`prisma_data_*.json`) - Human-readable data exports in JSON format

## 🔧 Quick Commands

### Create a Backup
```bash
npm run backup
```

This creates both:
- A PostgreSQL SQL dump
- A JSON export of all Prisma models

### List Available Backups
```bash
npm run backup:restore --list
```

### Restore from Backup
```bash
npm run backup:restore backup_2026-02-05_14-30-00.sql
```

⚠️ **Warning**: Restoring will replace ALL current data!

## 📝 Backup File Naming

Backups are automatically timestamped:
- Format: `backup_YYYY-MM-DD_HH-MM-SS.sql`
- Example: `backup_2026-02-05_14-30-00.sql`

## 🗓️ Recommended Backup Schedule

- **Before major changes**: Always backup before schema changes or major updates
- **Daily**: For active development
- **Before deployment**: Always backup production data before deploying
- **Weekly**: Minimum for stable applications

## ⚠️ Important Notes

1. **Do not commit backups to Git** - The `.gitignore` file excludes this directory
2. **Store critical backups elsewhere** - Consider copying important backups to external storage
3. **Test your restore process** - Periodically verify backups can be restored
4. **Disk space**: Monitor backup size as your database grows

## 🔄 Manual Backup (Alternative)

If you prefer manual backups:

```bash
# Backup
docker exec fred-postgres pg_dump -U fred_user -d fred_poc > backups/manual_backup.sql

# Restore
docker cp backups/manual_backup.sql fred-postgres:/tmp/restore.sql
docker exec fred-postgres psql -U fred_user -d fred_poc -f /tmp/restore.sql
```

## 💾 Backup Storage Recommendations

- Keep at least 7 days of backups
- Archive monthly backups for historical reference
- Use external storage for critical data (USB drive, cloud storage, NAS)
- Consider automated cloud backups for production

---

**Last Updated**: February 2026
