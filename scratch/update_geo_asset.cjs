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

const features = [];

targetRegions.forEach((target, index) => {
    const filePath = path.join(GEO_DISTRICTS_DIR, target.file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    const geo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    geo.features.forEach(f => {
        const provinceName = "Jawa Barat";
        const regionType = target.name.startsWith('Kota') ? 'Kota' : 'Kabupaten';
        const regionName = target.name.replace(/^(Kabupaten|Kota)\s+/i, '');
        const regionKey = `region-${slugify(`${provinceName}-${regionType}-${regionName}`)}`;

        // Simplify properties to match what app.js expects
        f.properties = {
            regionKey: regionKey,
            provinceName: provinceName,
            regionName: regionName,
            regionType: regionType,
            displayName: target.name,
            code: String(f.properties.OBJECTID || index)
        };
        features.push(f);
    });
});

const featureCollection = {
    type: 'FeatureCollection',
    features: features
};

try {
    const updateAsset = db.prepare("UPDATE assets SET json = ? WHERE key = 'audit_geojson'");
    const info = updateAsset.run(JSON.stringify(featureCollection));
    if (info.changes > 0) {
        console.log(`✅ Successfully updated audit_geojson with ${features.length} features.`);
    } else {
        console.warn("⚠️ Asset 'audit_geojson' not found in database. Trying to insert...");
        db.prepare("INSERT INTO assets (key, json) VALUES ('audit_geojson', ?)").run(JSON.stringify(featureCollection));
        console.log("✅ Successfully inserted audit_geojson.");
    }
} catch (e) {
    console.error(e);
}
db.close();
