const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const locations = db.prepare(`
        SELECT location_raw, COUNT(*) as count 
        FROM packages 
        GROUP BY location_raw 
        ORDER BY count DESC 
        LIMIT 20
    `).all();
    console.log('Top 20 locations:');
    locations.forEach(l => console.log(` - [${l.location_raw}]: ${l.count}`));

} catch (e) {
    console.error(e);
}
db.close();
