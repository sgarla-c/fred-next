/**
 * Database Backup Script
 * Creates timestamped backups of the PostgreSQL database
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = join(process.cwd(), 'backups');
const CONTAINER_NAME = 'fred-postgres';
const DB_NAME = 'fred_poc';
const DB_USER = 'fred_user';

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupFile = join(BACKUP_DIR, `backup_${timestamp}.sql`);

  console.log('🔄 Starting database backup...');
  console.log(`📁 Backup location: ${backupFile}`);

  try {
    // Create SQL dump using docker exec and pipe directly to file
    const command = `docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} --clean --if-exists > "${backupFile}"`;
    execSync(command, { shell: 'powershell.exe', stdio: 'inherit' });

    console.log('✅ Backup completed successfully!');
    console.log(`📦 Backup file: ${backupFile}`);
    console.log(`💾 Size: ${(require('fs').statSync(backupFile).size / 1024).toFixed(2)} KB`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

function createPrismaBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

  console.log('\n🔄 Creating Prisma data export...');

  try {
    execSync(`tsx scripts/export-prisma-data.ts ${timestamp}`, { stdio: ['ignore', 'inherit', 'pipe'] });
    const backupFile = join(BACKUP_DIR, `prisma_data_${timestamp}.json`);
    return backupFile;
  } catch (error) {
    // Silent failure - this is optional
    return null;
  }
}

async function main() {
  console.log('🚀 FRED Database Backup Tool\n');
  console.log('=' .repeat(50));

  try {
    // Check if Docker container is running
    try {
      execSync(`docker ps --filter name=${CONTAINER_NAME} --filter status=running --format "{{.Names}}"`, {
        encoding: 'utf-8',
      });
    } catch {
      console.error(`❌ Error: Docker container '${CONTAINER_NAME}' is not running.`);
      console.log('💡 Start your containers with: docker compose --profile dev up -d');
      process.exit(1);
    }

    // Create SQL backup
    const sqlBackup = createBackup();

    // Try to create Prisma JSON export (optional, may fail if not running inside Docker network)
    let jsonBackup: string | null = null;
    try {
      jsonBackup = createPrismaBackup();
    } catch (error) {
      console.log('⚠️  JSON export skipped (requires direct database access)');
      console.log('💡 SQL backup is complete and sufficient for full restoration');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Backup completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Backup Summary:');
    console.log(`  • SQL Dump: ${sqlBackup}`);
    if (jsonBackup) {
      console.log(`  • JSON Export: ${jsonBackup}`);
    }
    console.log('\n💡 To restore from SQL backup, use: npm run backup:restore <filename>');
  } catch (error) {
    console.error('\n❌ Backup process failed');
    process.exit(1);
  }
}

main();
