import Database from "better-sqlite3";
import path from "node:path";

let db = null;

// Initialize database with path from main process
export function initializeDatabase(userDataPath) {
  if (db) return db; // Already initialized

  const DB_PATH = path.join(userDataPath, "database.db");

  // Initialize the database
  db = new Database(DB_PATH, {
    verbose: console.log, // Log SQL queries in development
  });

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // Create tables
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(createTablesSQL);

  // Migration: Add profile_picture column if it doesn't exist
  try {
    const tableInfo = db.pragma("table_info(users)");
    const hasProfilePicture = tableInfo.some(
      (col) => col.name === "profile_picture",
    );

    if (!hasProfilePicture) {
      console.log("Migrating database: Adding profile_picture column...");
      db.exec("ALTER TABLE users ADD COLUMN profile_picture TEXT");
      console.log("Migration complete!");
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
  console.log("Database initialized at:", DB_PATH);

  return db;
}

// Get database instance
export function getDB() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return db;
}

export default { initializeDatabase, getDB };
