# 🛡️ FRED Backup System

Your local backup system is now configured! This guide will help you protect your data.

## ✨ Quick Start

### Create a Backup (Do this now!)
```bash
npm run backup
```

This creates two types of backups:
- **SQL Dump**: Full database backup that can be restored
- **JSON Export**: Human-readable data in JSON format

### List Your Backups
```bash
npm run backup:restore --list
```

### Restore from a Backup
```bash
npm run backup:restore backup_2026-02-05_14-30-00.sql
```

## 📅 When to Backup

### ✅ Always Backup Before:
- Making database schema changes
- Running data migrations
- Deploying to production
- Testing major new features
- Importing large amounts of data

### 📆 Regular Schedule:
- **Daily** during active development
- **Weekly** during stable periods
- **Before AND after** major changes

## 🗂️ Backup Storage

Backups are stored in: `fred-next/backups/`

### File Types:
- `backup_YYYY-MM-DD_HH-MM-SS.sql` - PostgreSQL dumps (for restore)
- `prisma_data_YYYY-MM-DD_HH-MM-SS.json` - JSON exports (for inspection)

## 🔒 Security Notes

✅ Backups are automatically excluded from Git (.gitignore)  
✅ Backups stay local on your machine  
⚠️ For important data, copy backups to external storage  
⚠️ Consider encrypting backups if they contain sensitive information

## 💾 Backup Best Practices

1. **Test your restore process** - Try restoring a backup to verify it works
2. **Keep multiple backups** - Don't rely on just one
3. **External storage** - Copy critical backups to USB drive or cloud storage
4. **Document changes** - Note what changed before each backup
5. **Clean up old backups** - Remove backups older than 30 days to save space

## 🚨 Emergency Restore

If something goes wrong:

1. Stop your application:
   ```bash
   docker compose down
   ```

2. Start just the database:
   ```bash
   docker compose up postgres -d
   ```

3. Restore your backup:
   ```bash
   npm run backup:restore backup_YYYY-MM-DD_HH-MM-SS.sql
   ```

4. Restart everything:
   ```bash
   docker compose --profile dev up -d
   ```

## 📊 Backup Size Management

Monitor your backup folder size:
- Each backup grows with your data
- Keep last 7-14 days of backups
- Archive older backups to external storage
- Delete very old backups (30+ days) if space is limited

## 🔧 Advanced Options

### Manual Docker Backup
```bash
docker exec fred-postgres pg_dump -U fred_user -d fred_poc > my_backup.sql
```

### Manual Docker Restore
```bash
docker cp my_backup.sql fred-postgres:/tmp/restore.sql
docker exec fred-postgres psql -U fred_user -d fred_poc -f /tmp/restore.sql
```

### Automated Backups
Create a scheduled task (Windows) or cron job (Linux/Mac) to run:
```bash
cd c:\Users\SGARLA-C\fred-next && npm run backup
```

## ❓ Troubleshooting

**"Container not running" error?**
- Start containers: `docker compose --profile dev up -d`

**"Backup file not found" error?**
- Check filename with: `npm run backup:restore --list`
- Make sure you're in the fred-next directory

**Restoration taking too long?**
- Normal for large databases
- Wait for completion message

## 📞 Need Help?

Check the detailed README:
```bash
cat backups/README.md
```

---

**Remember**: Your data is valuable. Back it up regularly! 🛡️
