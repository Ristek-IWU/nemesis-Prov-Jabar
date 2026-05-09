const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const pkgCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
    console.log(`Total packages: ${pkgCount}`);

    const regions = db.prepare('SELECT region_name, province_name FROM regions').all();
    console.log(`Total regions in DB: ${regions.length}`);
    regions.forEach(r => console.log(` - ${r.region_name} (${r.province_name})`));

    const uniqueLocations = db.prepare('SELECT DISTINCT location_raw FROM packages LIMIT 50').all();
    console.log('Sample unique locations in packages table:');
    uniqueLocations.forEach(l => console.log(` - ${l.location_raw}`));

    const packagesWithoutRegion = db.prepare(`
        SELECT COUNT(*) as count FROM packages 
        LEFT JOIN package_regions ON packages.id = package_regions.package_id 
        WHERE package_regions.region_key IS NULL
    `).get().count;
    console.log(`Packages without any region mapping: ${packagesWithoutRegion}`);

} catch (e) {
    console.error(e);
}
db.close();
