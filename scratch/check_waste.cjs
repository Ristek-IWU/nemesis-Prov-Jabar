const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const wasteStats = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN potential_waste > 0 THEN 1 ELSE 0 END) as with_waste,
            SUM(potential_waste) as total_waste
        FROM packages
    `).get();
    console.log('Overall Package Waste Stats:', wasteStats);

    const sampleWaste = db.prepare('SELECT package_name, potential_waste, location_raw FROM packages WHERE potential_waste > 0 LIMIT 10').all();
    console.log('Sample packages with waste:');
    sampleWaste.forEach(p => console.log(` - ${p.package_name}: ${p.potential_waste} @ ${p.location_raw}`));

    const regionWaste = db.prepare(`
        SELECT 
            regions.display_name,
            COUNT(package_regions.package_id) as pkg_count,
            SUM(packages.potential_waste) as total_waste
        FROM regions
        LEFT JOIN package_regions ON regions.region_key = package_regions.region_key
        LEFT JOIN packages ON package_regions.package_id = packages.id
        GROUP BY regions.region_key
        ORDER BY total_waste DESC
    `).all();
    console.log('Waste per Region:');
    regionWaste.forEach(r => console.log(` - ${r.display_name}: ${r.total_waste} (${r.pkg_count} pkgs)`));

} catch (e) {
    console.error(e);
}
db.close();
