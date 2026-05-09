const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const regionCounts = db.prepare(`
        SELECT regions.display_name, COUNT(package_regions.package_id) as count
        FROM regions
        LEFT JOIN package_regions ON regions.region_key = package_regions.region_key
        GROUP BY regions.region_key
    `).all();
    console.log('Package counts per region:');
    regionCounts.forEach(r => console.log(` - ${r.display_name}: ${r.count}`));

    const unmapped = db.prepare(`
        SELECT COUNT(*) as count FROM packages
        WHERE id NOT IN (SELECT package_id FROM package_regions)
    `).get().count;
    console.log(`Packages not mapped to any of the 12 regions: ${unmapped}`);

} catch (e) {
    console.error(e);
}
db.close();
