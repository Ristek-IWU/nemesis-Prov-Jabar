const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve('data/dashboard.sqlite');
const db = new Database(dbPath);

try {
    const assets = db.prepare('SELECT key FROM assets').all();
    console.log('Assets keys:', assets.map(a => a.key));

    const geoAsset = db.prepare("SELECT json FROM assets WHERE key = 'geo:districts'").get();
    if (geoAsset) {
        const geo = JSON.parse(geoAsset.json);
        console.log(`Geo districts features count: ${geo.features.length}`);
        console.log('Sample feature properties:', geo.features[0].properties);
    } else {
        console.log('Asset geo:districts NOT FOUND!');
    }
} catch (e) {
    console.error(e);
}
db.close();
