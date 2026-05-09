import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.join('data', 'dashboard.sqlite'));

try {
    const rows = db.prepare('SELECT location_raw, COUNT(*) as count FROM packages GROUP BY location_raw LIMIT 50').all();
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.error(e);
} finally {
    db.close();
}
