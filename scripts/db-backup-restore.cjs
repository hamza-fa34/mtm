#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const container = process.env.DB_CONTAINER || 'mtm_db';
const user = process.env.DB_USER || 'mtm';
const database = process.env.DB_NAME || 'mtm';
const input = process.argv[2];

if (!input) {
  console.error(
    'Usage: npm run db:backup:restore -- <path-to-backup.dump|path-to-backup.sql>',
  );
  process.exit(1);
}

const sourcePath = path.resolve(process.cwd(), input);
if (!fs.existsSync(sourcePath)) {
  console.error(`[db-backup-restore] file not found: ${sourcePath}`);
  process.exit(1);
}

const ext = path.extname(sourcePath).toLowerCase();
const filename = path.basename(sourcePath);
const containerPath = `/tmp/${filename}`;

execSync(`docker cp "${sourcePath}" ${container}:${containerPath}`, {
  stdio: 'inherit',
});

if (ext === '.dump') {
  execSync(
    `docker exec ${container} pg_restore -U ${user} -d ${database} --clean --if-exists ${containerPath}`,
    { stdio: 'inherit' },
  );
} else if (ext === '.sql') {
  execSync(`docker exec -i ${container} psql -U ${user} -d ${database} -f ${containerPath}`, {
    stdio: 'inherit',
  });
} else {
  console.error('[db-backup-restore] unsupported extension. Use .dump or .sql');
  process.exit(1);
}

execSync(`docker exec ${container} rm -f ${containerPath}`, { stdio: 'inherit' });
console.log(`[db-backup-restore] restored: ${sourcePath}`);
