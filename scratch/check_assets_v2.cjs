const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const geoAsset = db.prepare("SELECT json FROM assets WHERE key = 'audit_geojson'").get();
    if (geoAsset) {
        const geo = JSON.parse(geoAsset.json);
        console.log(`Geo audit_geojson features count: ${geo.features.length}`);
        if (geo.features.length > 0) {
            console.log('Sample feature region names:', geo.features.slice(0, 5).map(f => f.properties.regionName));
        }
    } else {
        console.log('Asset audit_geojson NOT FOUND!');
    }
} catch (e) {
    console.error(e);
}
db.close();
