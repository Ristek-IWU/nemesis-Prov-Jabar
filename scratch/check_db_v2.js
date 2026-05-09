const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const pkgCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
    console.log(`Total packages: ${pkgCount}`);

    const regionCount = db.prepare('SELECT COUNT(*) as count FROM regions').get().count;
    console.log(`Total regions: ${regionCount}`);

    const regions = db.prepare('SELECT region_name, province_name FROM regions LIMIT 20').all();
    console.log('Sample regions:');
    regions.forEach(r => console.log(` - ${r.region_name} (${r.province_name})`));

    const metricsCount = db.prepare('SELECT COUNT(*) as count FROM region_metrics').get().count;
    console.log(`Total region_metrics: ${metricsCount}`);

    const locations = db.prepare('SELECT location_raw FROM packages LIMIT 20').all();
    console.log('Sample locations:');
    locations.forEach(l => console.log(` - ${l.location_raw}`));

} catch (e) {
    console.error(e);
}
db.close();
