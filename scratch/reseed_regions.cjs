const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

const GEO_DISTRICTS_DIR = path.resolve('seed/geo/03-districts');

const targetRegions = [
    { name: 'Kota Bandung', file: 'Kota_Bandung.geojson' },
    { name: 'Kota Bogor', file: 'Kota_Bogor.geojson' },
    { name: 'Kota Bekasi', file: 'Kota_Bekasi.geojson' },
    { name: 'Kota Cimahi', file: 'Kota_Cimahi.geojson' },
    { name: 'Kota Tasikmalaya', file: 'Kota_Tasikmalaya.geojson' },
    { name: 'Kabupaten Bandung', file: 'Bandung.geojson' },
    { name: 'Kabupaten Bandung Barat', file: 'Bandung_Barat.geojson' },
    { name: 'Kabupaten Sumedang', file: 'Sumedang.geojson' },
    { name: 'Kabupaten Purwakarta', file: 'Purwakarta.geojson' },
    { name: 'Kabupaten Garut', file: 'Garut.geojson' },
    { name: 'Kabupaten Tasikmalaya', file: 'Tasikmalaya.geojson' },
    { name: 'Kabupaten Pangandaran', file: 'Pangandaran.geojson' }
];

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeRegionKey(value) {
    return slugify(value.replace(/^(kabupaten|kab|kota)\s+/i, ''));
}

db.transaction(() => {
    // 1. Insert missing regions
    const insertRegion = db.prepare(`
        INSERT OR IGNORE INTO regions (
            region_key, code, province_name, region_name, region_type, display_name, feature_index
        ) VALUES (
            @region_key, @code, @province_name, @region_name, @region_type, @display_name, @feature_index
        )
    `);

    targetRegions.forEach((target, index) => {
        const filePath = path.join(GEO_DISTRICTS_DIR, target.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return;
        }

        const geo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const feature = geo.features[0];
        const props = feature.properties;

        const provinceName = "Jawa Barat"; // Hardcoded for this task as requested
        const regionType = target.name.startsWith('Kota') ? 'Kota' : 'Kabupaten';
        const regionName = target.name.replace(/^(Kabupaten|Kota)\s+/i, '');
        const regionKey = `region-${slugify(`${provinceName}-${regionType}-${regionName}`)}`;

        const record = {
            region_key: regionKey,
            code: String(props.OBJECTID || props.code || index),
            province_name: provinceName,
            region_name: regionName,
            region_type: regionType,
            display_name: target.name,
            feature_index: index
        };

        insertRegion.run(record);
        console.log(`Inserted/Checked region: ${target.name} (${regionKey})`);
    });

    // 2. Re-map packages to regions if needed
    // This part is tricky because we need to match location_raw
    // But since the user says the packages are already there, let's see if we can link them.
    
    // We'll clear package_regions for these regions and re-insert?
    // Actually, let's just run a mapping script.
    
    console.log("Re-mapping packages to regions...");
    const packages = db.prepare("SELECT id, location_raw FROM packages").all();
    const insertMapping = db.prepare("INSERT OR IGNORE INTO package_regions (package_id, region_key) VALUES (?, ?)");
    
    // Create a lookup for regions
    const allRegions = db.prepare("SELECT * FROM regions").all();
    
    packages.forEach(pkg => {
        const location = String(pkg.location_raw || '').toLowerCase();
        allRegions.forEach(reg => {
            const searchName = reg.region_name.toLowerCase();
            const searchType = reg.region_type.toLowerCase();
            
            // Simple match: location contains region name
            if (location.includes(searchName)) {
                // To avoid "Bandung" matching "Bandung Barat" wrongly
                if (searchName === 'bandung' && location.includes('bandung barat') && reg.region_name !== 'Bandung Barat') {
                    return;
                }
                insertMapping.run(pkg.id, reg.region_key);
            }
        });
    });

    // 3. Materialize Metrics
    console.log("Materializing region metrics...");
    db.prepare("DELETE FROM region_metrics").run();
    
    db.prepare(`
        INSERT INTO region_metrics (
            region_key, total_packages, total_priority_packages, total_flagged_packages,
            total_potential_waste, total_budget, avg_risk_score, max_risk_score,
            central_packages, provincial_packages, local_packages, other_packages,
            central_priority_packages, provincial_priority_packages, local_priority_packages, other_priority_packages,
            central_potential_waste, provincial_potential_waste, local_potential_waste, other_potential_waste,
            central_budget, provincial_budget, local_budget, other_budget,
            med_severity_packages, high_severity_packages, absurd_severity_packages
        )
        SELECT
            regions.region_key,
            COUNT(DISTINCT packages.id) as total_packages,
            SUM(CASE WHEN packages.is_priority = 1 THEN 1 ELSE 0 END) as total_priority_packages,
            SUM(CASE WHEN packages.is_flagged = 1 THEN 1 ELSE 0 END) as total_flagged_packages,
            SUM(packages.potential_waste) as total_potential_waste,
            SUM(packages.budget) as total_budget,
            AVG(packages.risk_score) as avg_risk_score,
            MAX(packages.risk_score) as max_risk_score,
            SUM(CASE WHEN packages.owner_type = 'central' THEN 1 ELSE 0 END) as central_packages,
            SUM(CASE WHEN packages.owner_type = 'provinsi' THEN 1 ELSE 0 END) as provincial_packages,
            SUM(CASE WHEN packages.owner_type = 'kabkota' THEN 1 ELSE 0 END) as local_packages,
            SUM(CASE WHEN packages.owner_type = 'other' THEN 1 ELSE 0 END) as other_packages,
            SUM(CASE WHEN packages.owner_type = 'central' AND packages.is_priority = 1 THEN 1 ELSE 0 END) as central_priority_packages,
            SUM(CASE WHEN packages.owner_type = 'provinsi' AND packages.is_priority = 1 THEN 1 ELSE 0 END) as provincial_priority_packages,
            SUM(CASE WHEN packages.owner_type = 'kabkota' AND packages.is_priority = 1 THEN 1 ELSE 0 END) as local_priority_packages,
            SUM(CASE WHEN packages.owner_type = 'other' AND packages.is_priority = 1 THEN 1 ELSE 0 END) as other_priority_packages,
            SUM(CASE WHEN packages.owner_type = 'central' THEN packages.potential_waste ELSE 0 END) as central_potential_waste,
            SUM(CASE WHEN packages.owner_type = 'provinsi' THEN packages.potential_waste ELSE 0 END) as provincial_potential_waste,
            SUM(CASE WHEN packages.owner_type = 'kabkota' THEN packages.potential_waste ELSE 0 END) as local_potential_waste,
            SUM(CASE WHEN packages.owner_type = 'other' THEN packages.potential_waste ELSE 0 END) as other_potential_waste,
            SUM(CASE WHEN packages.owner_type = 'central' THEN packages.budget ELSE 0 END) as central_budget,
            SUM(CASE WHEN packages.owner_type = 'provinsi' THEN packages.budget ELSE 0 END) as provincial_budget,
            SUM(CASE WHEN packages.owner_type = 'kabkota' THEN packages.budget ELSE 0 END) as local_budget,
            SUM(CASE WHEN packages.owner_type = 'other' THEN packages.budget ELSE 0 END) as other_budget,
            SUM(CASE WHEN packages.severity = 'med' THEN 1 ELSE 0 END) as med_severity_packages,
            SUM(CASE WHEN packages.severity = 'high' THEN 1 ELSE 0 END) as high_severity_packages,
            SUM(CASE WHEN packages.severity = 'absurd' THEN 1 ELSE 0 END) as absurd_severity_packages
        FROM regions
        JOIN package_regions ON regions.region_key = package_regions.region_key
        JOIN packages ON packages.id = package_regions.package_id
        GROUP BY regions.region_key
    `).run();

    console.log("✅ Done fixing regions and metrics!");
})();

db.close();
