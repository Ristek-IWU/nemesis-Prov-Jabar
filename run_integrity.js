import fs from 'fs';
import { loadSqlJs } from './src/backend/db.js';

async function main() {
  const file = 'data/database.sqlite';
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }

  const buffer = fs.readFileSync(file);
  const SQL = await loadSqlJs();
  const sqlDb = new SQL.Database(new Uint8Array(buffer));
  try {
    const res = sqlDb.exec('PRAGMA integrity_check;');
    console.log('integrity_check result:', JSON.stringify(res));
  } finally {
    try { sqlDb.close(); } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});