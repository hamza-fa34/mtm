#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const container = process.env.DB_CONTAINER || 'mtm_db';
const user = process.env.DB_USER || 'mtm';
const database = process.env.DB_NAME || 'mtm';
const backupsDir = path.resolve(process.cwd(), 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = process.env.DB_BACKUP_FILE || `mtm_${timestamp}.dump`;
const hostPath = path.join(backupsDir, filename);
const containerPath = `/tmp/${filename}`;

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

execSync(
  `docker exec ${container} pg_dump -U ${user} -d ${database} -Fc -f ${containerPath}`,
  { stdio: 'inherit' },
);
execSync(`docker cp ${container}:${containerPath} "${hostPath}"`, {
  stdio: 'inherit',
});
execSync(`docker exec ${container} rm -f ${containerPath}`, { stdio: 'inherit' });

console.log(`[db-backup-dump] created: ${hostPath}`);
