import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

async function run() {
    const sourcePath = path.resolve('data/dashboard.sqlite');
    const destPath = path.resolve('data/database.sqlite');

    if (fs.existsSync(destPath)) {
        console.log('Deleting existing database.sqlite...');
        fs.unlinkSync(destPath);
    }

    console.log('Opening source database...');
    const db = new Database(sourcePath, { readonly: false });

    console.log('Attaching destination database...');
    db.prepare('ATTACH DATABASE ? AS filtered').run(destPath);

    // Disable foreign keys during migration to avoid constraint errors
    db.exec("PRAGMA filtered.foreign_keys = OFF");

    const tables = [
        'packages',
        'regions',
        'provinces',
        'package_regions',
        'package_provinces',
        'region_metrics',
        'province_metrics',
        'owner_metrics',
        'assets'
    ];

    console.log('Creating schemas...');
    for (const table of tables) {
        const row = db.prepare(`SELECT sql FROM main.sqlite_master WHERE type='table' AND name='${table}'`).get();
        if (row) {
            let createSql = row.sql.replace(`CREATE TABLE ${table}`, `CREATE TABLE filtered.${table}`);
            // Remove some specific constraints if they cause issues, but usually it's fine
            db.exec(createSql);
        }
    }

    console.log('Filtering Provinces & Regions...');
    db.exec("INSERT INTO filtered.provinces SELECT * FROM main.provinces WHERE province_key = 'province-jawa-barat'");
    db.exec("INSERT INTO filtered.regions SELECT * FROM main.regions WHERE province_name = 'Jawa Barat'");

    console.log('Filtering Packages (this may take a few minutes)...');
    db.exec(`
        INSERT INTO filtered.packages 
        SELECT * FROM main.packages 
        WHERE (id IN (SELECT package_id FROM main.package_regions WHERE region_key IN (SELECT region_key FROM filtered.regions))
        OR id IN (SELECT package_id FROM main.package_provinces WHERE province_key = 'province-jawa-barat'))
        AND owner_type IN ('provinsi', 'kabkota')
    `);

    console.log('Filtering Package Mappings...');
    db.exec("INSERT INTO filtered.package_regions SELECT * FROM main.package_regions WHERE region_key IN (SELECT region_key FROM filtered.regions)");
    db.exec("INSERT INTO filtered.package_provinces SELECT * FROM main.package_provinces WHERE province_key = 'province-jawa-barat'");

    console.log('Filtering Metrics...');
    db.exec("INSERT INTO filtered.province_metrics SELECT * FROM main.province_metrics WHERE province_key = 'province-jawa-barat'");
    db.exec("INSERT INTO filtered.region_metrics SELECT * FROM main.region_metrics WHERE region_key IN (SELECT region_key FROM filtered.regions)");

    console.log('Filtering Owner Metrics...');
    db.exec(`
        INSERT INTO filtered.owner_metrics 
        SELECT * FROM main.owner_metrics 
        WHERE (owner_name, owner_type) IN (
            SELECT DISTINCT owner_name, owner_type FROM filtered.packages
        )
    `);

    console.log('Copying Assets...');
    db.exec("INSERT INTO filtered.assets SELECT * FROM main.assets");

    console.log('Verifying Jawa Barat scope...');
    const provCount = db.prepare("SELECT COUNT(*) AS n FROM filtered.provinces").get().n;
    const regionRows = db.prepare(`
        SELECT COUNT(*) AS n,
               COUNT(DISTINCT province_name) AS provinces_seen,
               GROUP_CONCAT(DISTINCT province_name) AS names
        FROM filtered.regions
    `).get();
    const byType = db.prepare(`
        SELECT region_type, COUNT(*) AS n FROM filtered.regions GROUP BY region_type ORDER BY region_type
    `).all();
    console.log(`  Provinces row(s) in filtered DB: ${provCount} (expected 1)`);
    console.log(`  Regions: ${regionRows.n} rows, distinct province_name: ${regionRows.provinces_seen} — ${regionRows.names}`);
    console.log(`  By region_type: ${byType.map(r => `${r.region_type}=${r.n}`).join(', ') || '(none)'}`);
    if (provCount !== 1 || regionRows.provinces_seen !== 1 || !String(regionRows.names || '').includes('Jawa Barat')) {
        console.warn('  Warning: filtered regions/provinces may not be Jawa Barat-only; check source data (province_name / province_key).');
    }

    console.log('Detaching and closing...');
    db.exec('DETACH DATABASE filtered');
    db.close();

    // Indexes on attached schema are fragile across SQLite builds; after detach, tables
    // in database.sqlite live on `main` — same DDL as seed.js works reliably.
    console.log('Creating indexes on database.sqlite...');
    const destDb = new Database(destPath);
    destDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_packages_priority_order ON packages(is_priority, potential_waste DESC, risk_score DESC);
        CREATE INDEX IF NOT EXISTS idx_packages_owner_type ON packages(owner_type);
        CREATE INDEX IF NOT EXISTS idx_packages_owner_lookup ON packages(owner_type, owner_name);
        CREATE INDEX IF NOT EXISTS idx_packages_severity ON packages(severity);
        CREATE INDEX IF NOT EXISTS idx_package_regions_region ON package_regions(region_key, package_id);
        CREATE INDEX IF NOT EXISTS idx_package_provinces_province ON package_provinces(province_key, package_id);
    `);
    destDb.close();

    const oldSize = fs.statSync(sourcePath).size;
    const newSize = fs.statSync(destPath).size;
    console.log(`Success!`);
    console.log(`Original Size: ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Filtered Size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
