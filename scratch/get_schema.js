import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('data/dashboard.sqlite', { readonly: true });
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type IN ('table', 'index')").all();
const sql = schema.map(s => s.sql).join(';\n') + ';';
fs.writeFileSync('schema.sql', sql);
db.close();
console.log('Schema exported to schema.sql');
