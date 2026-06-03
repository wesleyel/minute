import pg from "pg";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const postgresUrl =
  process.env.POSTGRES_URL ??
  "postgresql://postgres:postgres@localhost:5432/minute";
const sqlitePath =
  process.env.SQLITE_PATH ?? path.join(root, "packages/prisma/minute.db");

const tables = [
  "User",
  "Account",
  "Session",
  "UserSecurityLog",
  "VerificationToken",
  "Folder",
  "Category",
  "Chart",
  "FolderHierarchy",
  "RunningTimeEntry",
  "Task",
  "TimeEntry",
  "CategoryFolder",
  "ChartFolder",
  "ChartCategory",
];

const serialize = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
};

const pool = new pg.Pool({ connectionString: postgresUrl });
const db = new Database(sqlitePath);

try {
  db.pragma("foreign_keys = OFF");
  db.exec("BEGIN");

  for (const table of tables) {
    const columns = db
      .prepare(`PRAGMA table_info("${table}")`)
      .all()
      .map(({ name }) => name);

    if (columns.length === 0) {
      throw new Error(`SQLite table "${table}" does not exist.`);
    }

    const columnList = columns.map((name) => `"${name}"`).join(", ");
    const { rows } = await pool.query(
      `SELECT ${columnList} FROM "${table}"`,
    );

    db.prepare(`DELETE FROM "${table}"`).run();

    if (rows.length === 0) {
      console.log(`${table}: 0 rows`);
      continue;
    }

    const placeholders = columns.map(() => "?").join(", ");
    const insert = db.prepare(
      `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
    );

    for (const row of rows) {
      insert.run(...columns.map((column) => serialize(row[column])));
    }

    console.log(`${table}: ${rows.length} rows`);
  }

  db.exec("COMMIT");
  console.log(`Migration complete → ${sqlitePath}`);
} catch (error) {
  db.exec("ROLLBACK");
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  db.pragma("foreign_keys = ON");
  db.close();
  await pool.end();
}
