import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('data/dashboard.sqlite');

const province = db.prepare("SELECT * FROM provinces WHERE province_name LIKE '%Jawa Barat%'").get();
console.log('Province:', province);

const regionCount = db.prepare("SELECT COUNT(*) as count FROM regions WHERE province_name LIKE '%Jawa Barat%'").get();
console.log('Region Count for Jabar:', regionCount.count);

db.close();
