import Database from 'better-sqlite3';

const db = new Database('data/dashboard.sqlite');

const pkgCount = db.prepare(`
  SELECT COUNT(DISTINCT package_id) as count 
  FROM package_regions 
  WHERE region_key IN (SELECT region_key FROM regions WHERE province_name LIKE '%Jawa Barat%')
`).get();
console.log('Package Count for Jabar regions:', pkgCount.count);

const provPkgCount = db.prepare(`
  SELECT COUNT(*) as count FROM package_provinces WHERE province_key = 'province-jawa-barat'
`).get();
console.log('Package Count for Jabar province:', provPkgCount.count);

db.close();
