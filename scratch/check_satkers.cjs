const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const satkers = db.prepare(`
        SELECT satker, COUNT(*) as count 
        FROM packages 
        GROUP BY satker 
        ORDER BY count DESC 
        LIMIT 20
    `).all();
    console.log('Top 20 Satkers:');
    satkers.forEach(s => console.log(` - [${s.satker}]: ${s.count}`));

} catch (e) {
    console.error(e);
}
db.close();
