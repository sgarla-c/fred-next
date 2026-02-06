/**
 * Database Restore Script
 * Restores database from a backup file
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const BACKUP_DIR = join(process.cwd(), 'backups');
const CONTAINER_NAME = 'fred-postgres';
const DB_NAME = 'fred_poc';
const DB_USER = 'fred_user';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function confirmRestore(): Promise<boolean> {
  console.log('\n⚠️  WARNING: This will replace ALL current data in the database!');
  const answer = await question('Are you sure you want to continue? (yes/no): ');
  return answer.toLowerCase() === 'yes';
}

async function restoreBackup(backupFile: string) {
  const backupPath = backupFile.includes(BACKUP_DIR) 
    ? backupFile 
    : join(BACKUP_DIR, backupFile);

  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    console.log('\n📁 Available backups:');
    try {
      const files = require('fs').readdirSync(BACKUP_DIR);
      files
        .filter((f: string) => f.endsWith('.sql'))
        .forEach((f: string) => console.log(`  • ${f}`));
    } catch (error) {
      console.log('  No backups found');
    }
    process.exit(1);
  }

  console.log('\n🔄 Starting database restore...');
  console.log(`📁 Restoring from: ${backupPath}`);

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

    // Copy backup file into container
    console.log('📤 Copying backup file to container...');
    execSync(`docker cp "${backupPath}" ${CONTAINER_NAME}:/tmp/restore.sql`);

    // Restore database
    console.log('🔄 Restoring database...');
    execSync(`docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -f /tmp/restore.sql`, {
      stdio: 'inherit'
    });

    // Clean up
    execSync(`docker exec ${CONTAINER_NAME} rm /tmp/restore.sql`);

    console.log('\n✅ Database restored successfully!');
    console.log('💡 You may need to restart your application to reflect the changes.');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

async function listBackups() {
  console.log('📁 Available backups:\n');
  try {
    const files = require('fs').readdirSync(BACKUP_DIR);
    const sqlFiles = files.filter((f: string) => f.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      console.log('  No SQL backups found');
      console.log('\n💡 Create a backup with: npm run backup');
      return;
    }

    sqlFiles.forEach((f: string) => {
      const stats = require('fs').statSync(join(BACKUP_DIR, f));
      const size = (stats.size / 1024).toFixed(2);
      const date = stats.mtime.toLocaleString();
      console.log(`  📦 ${f}`);
      console.log(`     Size: ${size} KB | Created: ${date}\n`);
    });
  } catch (error) {
    console.log('  Backups directory not found');
    console.log('\n💡 Create a backup with: npm run backup');
  }
}

async function main() {
  console.log('🚀 FRED Database Restore Tool\n');
  console.log('='.repeat(50));

  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list') {
    await listBackups();
    rl.close();
    return;
  }

  const backupFile = args[0];

  const confirmed = await confirmRestore();
  rl.close();

  if (!confirmed) {
    console.log('\n❌ Restore cancelled');
    process.exit(0);
  }

  try {
    await restoreBackup(backupFile);
    console.log('\n' + '='.repeat(50));
    console.log('✨ Restore completed successfully!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Restore process failed');
    process.exit(1);
  }
}

main();
