import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export class Migrator {
  constructor(db) {
    this.db = db;
    // Use app.getAppPath() to get the source directory
    const appPath = app.getAppPath();
    this.migrationsPath = path.join(
      appPath,
      "electron",
      "server",
      "db",
      "migrations",
    );
  }

  // Get all executed migration versions from the database
  getExecutedMigrations() {
    const stmt = this.db.prepare(
      "SELECT version FROM migrations ORDER BY version",
    );
    return stmt.all().map((row) => row.version);
  }

  // Get all migration files from the migrations folder
  async getMigrationFiles() {
    // Check if migrations folder exists
    if (!fs.existsSync(this.migrationsPath)) {
      console.log("No migrations folder found, skipping migrations");
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith(".js"))
      .sort(); // Sort to ensure order (001, 002, 003, etc.)

    return files;
  }

  // Run all pending migrations
  async runMigrations() {
    try {
      const files = await this.getMigrationFiles();

      if (files.length === 0) {
        console.log("No migration files found");
        return;
      }

      const executedVersions = this.getExecutedMigrations();
      console.log(`Executed migrations: [${executedVersions.join(", ")}]`);

      for (const file of files) {
        const migrationModule = await import(
          path.join(this.migrationsPath, file)
        );
        const { version, name, up } = migrationModule;

        // Skip if already executed
        if (executedVersions.includes(version)) {
          console.log(`✓ Migration ${version} (${name}) already executed`);
          continue;
        }

        console.log(`Running migration ${version}: ${name}...`);

        // Run migration in a transaction
        const transaction = this.db.transaction(() => {
          up(this.db);

          // Record migration
          const stmt = this.db.prepare(
            "INSERT INTO migrations (version, name) VALUES (?, ?)",
          );
          stmt.run(version, name);
        });

        transaction();
        console.log(`✓ Migration ${version} completed successfully`);
      }

      console.log("All migrations completed");
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  // Rollback the last migration (optional, for development)
  async rollbackLastMigration() {
    try {
      const executedVersions = this.getExecutedMigrations();

      if (executedVersions.length === 0) {
        console.log("No migrations to rollback");
        return;
      }

      const lastVersion = executedVersions[executedVersions.length - 1];

      // Find the migration file
      const files = await this.getMigrationFiles();
      const migrationFile = files.find((file) => {
        const match = file.match(/^(\d+)/);
        return match && parseInt(match[1]) === lastVersion;
      });

      if (!migrationFile) {
        throw new Error(`Migration file for version ${lastVersion} not found`);
      }

      const migrationModule = await import(
        path.join(this.migrationsPath, migrationFile)
      );
      const { version, name, down } = migrationModule;

      console.log(`Rolling back migration ${version}: ${name}...`);

      const transaction = this.db.transaction(() => {
        down(this.db);

        // Remove migration record
        const stmt = this.db.prepare(
          "DELETE FROM migrations WHERE version = ?",
        );
        stmt.run(version);
      });

      transaction();
      console.log(`✓ Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error("Rollback failed:", error);
      throw error;
    }
  }
}
