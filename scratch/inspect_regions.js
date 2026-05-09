import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.join('data', 'dashboard.sqlite'));

try {
    const rows = db.prepare('SELECT r.display_name, rm.total_packages FROM regions r JOIN region_metrics rm ON r.region_key = rm.region_key').all();
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.error(e);
} finally {
    db.close();
}
