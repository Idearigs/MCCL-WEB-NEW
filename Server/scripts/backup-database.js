const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
const backupFile = path.join(backupsDir, `mcculloch_backup_${timestamp}.sql`);

console.log('🔄 Starting database backup...');
console.log(`📁 Backup location: ${backupFile}`);

// Database connection details from .env
const host = process.env.PG_HOST || 'localhost';
const port = process.env.PG_PORT || 5432;
const database = process.env.PG_DATABASE || 'mcculloch_db';
const username = process.env.PG_USERNAME || 'postgres';
const password = process.env.PG_PASSWORD || '';

// pg_dump command
// Note: You need to have PostgreSQL client tools installed
const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    console.error('💡 Make sure PostgreSQL client tools (pg_dump) are installed');
    console.error('   Download from: https://www.postgresql.org/download/');
    process.exit(1);
  }

  if (stderr) {
    console.log('⚠️  Warnings:', stderr);
  }

  console.log('✅ Database backup completed successfully!');
  console.log(`📦 Backup file: ${backupFile}`);
  console.log(`📊 Backup size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);

  // List all backups
  console.log('\n📋 All backups:');
  const backups = fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();

  backups.forEach((file, index) => {
    const filePath = path.join(backupsDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ${index + 1}. ${file} (${size} MB)`);
  });

  console.log('\n💾 To restore this backup, run:');
  console.log(`   PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}"`);
});
