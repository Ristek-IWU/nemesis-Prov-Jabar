const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('data/kabupaten_sumedang.sqlite');
const db = new Database(dbPath);

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in kabupaten_sumedang.sqlite:', tables.map(t => t.name));

    if (tables.some(t => t.name === 'packages')) {
        const pkgCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
        console.log(`Total packages in Sumedang DB: ${pkgCount}`);
        const waste = db.prepare('SELECT SUM(potential_waste) as total FROM packages').get().total;
        console.log(`Total waste in Sumedang DB: ${waste}`);
    }
} catch (e) {
    console.error(e);
}
db.close();
