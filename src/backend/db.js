import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DATA_DIR, DB_PATH } from './config.js';

const SQLITE_EXTENSIONS = new Set(['.sqlite', '.sqlite3', '.db']);
const REQUIRED_SCHEMA_TABLES = ['packages', 'regions'];
const MAX_SQLITE_LOAD_BYTES = 2 * 1024 * 1024 * 1024;

const require = createRequire(import.meta.url);

function isSqliteFile(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return SQLITE_EXTENSIONS.has(extension);
}

function listExistingSqliteFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isSqliteFile(entry.name))
    .map((entry) => path.resolve(directoryPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function isLoadableSqliteFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size <= MAX_SQLITE_LOAD_BYTES;
  } catch {
    return false;
  }
}

async function hasApplicationSchemaAsync(filePath) {
  const db = await openDatabase({ dbPath: filePath, readonly: true });
  try {
    return REQUIRED_SCHEMA_TABLES.every((tableName) =>
      db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
    );
  } catch {
    return false;
  } finally {
    try { db.close(); } catch {}
  }
}

async function resolveRuntimeDbPath() {
  const configuredPath = path.resolve(DB_PATH);
  if (fs.existsSync(configuredPath) && isLoadableSqliteFile(configuredPath)) {
    return configuredPath;
  }

  const configuredFileName = path.basename(configuredPath).toLowerCase();
  const existingDatabases = listExistingSqliteFiles(DATA_DIR);
  const loadableDatabases = existingDatabases.filter(isLoadableSqliteFile);

  if (!loadableDatabases.length) {
    return configuredPath;
  }

  const schemaDatabases = [];
  for (const candidate of loadableDatabases) {
    // eslint-disable-next-line no-await-in-loop
    if (await hasApplicationSchemaAsync(candidate)) {
      schemaDatabases.push(candidate);
    }
  }
  const preferredDatabases = schemaDatabases.length ? schemaDatabases : loadableDatabases;
  const configuredMatch = preferredDatabases.find(
    (filePath) => path.basename(filePath).toLowerCase() === configuredFileName
  );

  return configuredMatch || preferredDatabases[0];
}

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeBindParams(params) {
  if (params.length === 0) return undefined;
  if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) {
    return params[0];
  }
  return params;
}

function wrapSqlJsDatabase(sqlDb, { readonly }) {
  const db = {
    __readonly: Boolean(readonly),
    exec(sql) {
      return sqlDb.exec(String(sql));
    },
    close() {
      sqlDb.close();
    },
    prepare(sql) {
      const stmt = sqlDb.prepare(String(sql));

      return {
        get(...params) {
          const bound = normalizeBindParams(params);
          if (bound !== undefined) stmt.bind(bound);
          const hasRow = stmt.step();
          const row = hasRow ? stmt.getAsObject() : undefined;
          stmt.reset();
          return row;
        },
        all(...params) {
          const bound = normalizeBindParams(params);
          if (bound !== undefined) stmt.bind(bound);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.reset();
          return rows;
        },
        run(...params) {
          const bound = normalizeBindParams(params);
          if (bound !== undefined) stmt.bind(bound);
          // For DML, step() executes statement once.
          stmt.step();
          stmt.reset();
        },
      };
    },
    transaction(callback) {
      return () => {
        sqlDb.run('BEGIN');
        try {
          callback();
          sqlDb.run('COMMIT');
        } catch (error) {
          try {
            sqlDb.run('ROLLBACK');
          } catch {
            // ignore rollback errors
          }
          throw error;
        }
      };
    },
  };

  return db;
}

async function loadSqlJs() {
  try {
    const initSqlJs = (await import('sql.js')).default;

    // Determine directory that contains sql-wasm.wasm. Try several strategies and
    // allow an explicit override via environment variable for constrained hosts
    // like hPanel where resolving package files can fail.
    let distDir = null;

    if (process.env.SQLITE_WASM_PATH) {
      distDir = path.dirname(process.env.SQLITE_WASM_PATH);
    } else {
      try {
        const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
        distDir = path.dirname(wasmPath);
      } catch (err) {
        // Fallback: try node_modules relative to process.cwd()
        const alt = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist');
        if (fs.existsSync(path.join(alt, 'sql-wasm.wasm'))) {
          distDir = alt;
        }
      }
    }

    if (!distDir) {
      throw new Error(
        'Cannot locate sql.js WASM files. Set SQLITE_WASM_PATH env to the path of sql-wasm.wasm or install sql.js in node_modules.'
      );
    }

    return initSqlJs({
      locateFile: (file) => path.join(distDir, file),
    });
  } catch (err) {
    throw new Error(`Failed to load sql.js: ${err.message}`);
  }
}

async function openDatabase(options = {}) {
  ensureDataDirectory();
  const runtimeDbPath = path.resolve(options.dbPath || (await resolveRuntimeDbPath()));
  const readonly =
    options.readonly ??
    (process.env.SQLITE_READONLY
      ? String(process.env.SQLITE_READONLY).trim().toLowerCase() !== 'false'
      : true);

  if (!fs.existsSync(runtimeDbPath)) {
    throw new Error(`SQLite database file not found at ${runtimeDbPath}`);
  }

  const stats = fs.statSync(runtimeDbPath);
  if (!stats.isFile()) {
    throw new Error(`SQLite database path is not a file: ${runtimeDbPath}`);
  }

  if (stats.size > MAX_SQLITE_LOAD_BYTES) {
    throw new Error(
      `SQLite database file is too large to load into sql.js (${runtimeDbPath}, ${(stats.size / 1024 / 1024).toFixed(2)} MB). Use a filtered database such as data/database.sqlite instead.`
    );
  }

  // Note: sql.js loads SQLite into memory. For large files (~250MB), ensure hosting memory is sufficient.
  const buffer = fs.readFileSync(runtimeDbPath);

  const SQL = await loadSqlJs();
  const sqlDb = new SQL.Database(new Uint8Array(buffer));
  sqlDb.run('PRAGMA foreign_keys = ON;');

  return wrapSqlJsDatabase(sqlDb, { readonly });
}

export {
  DB_PATH,
  hasApplicationSchemaAsync as hasApplicationSchema,
  listExistingSqliteFiles,
  openDatabase,
  resolveRuntimeDbPath,
  loadSqlJs,
};
