/**
 * Migration runner — reads .sql files from the migrations directory
 * and applies them in order.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Database as DatabaseType } from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

/**
 * Run all pending migrations against the given database.
 * Tracks applied migrations in a `_migrations` table.
 */
export function runMigrations(db: DatabaseType): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Get already-applied migrations
  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[])
      .map((r) => r.name),
  );

  // Read migration files
  let files: string[];
  try {
    files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    // No migrations directory in compiled output — try relative to src
    console.warn('[db] No migrations directory found, skipping migrations');
    return;
  }

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[db] Applying migration: ${file}`);

    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    })();
  }
}

// CLI entry point
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^file:\/\//, ''))) {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = process.argv[2] || 'data/contributions.db';
  console.log(`[db] Running migrations on: ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  db.close();
  console.log('[db] Migrations complete');
}
