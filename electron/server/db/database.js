import Database from "better-sqlite3";
import path from "node:path";
import { Migrator } from "./migrator.js";

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

  const migrationTableConfigSQL = `
    CREATE TABLE IF NOT EXISTS migrations(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP 
    );`;

  db.exec(createTablesSQL);
  db.exec(migrationTableConfigSQL);

  const migrator = new Migrator(db);
  migrator.runMigrations();

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
