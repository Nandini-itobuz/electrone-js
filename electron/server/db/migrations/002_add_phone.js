export const up = (db) => {
  console.log("  → Adding phone column...");
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
};

export const down = (db) => {
  console.log("  → Removing phone column...");

  // Create new table without phone column
  db.exec(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      profile_picture TEXT
    );
  `);

  // Copy data (excluding phone)
  db.exec(`
    INSERT INTO users_new (id, name, email, password, created_at, profile_picture)
    SELECT id, name, email, password, created_at, profile_picture FROM users;
  `);

  // Drop old table
  db.exec("DROP TABLE users;");

  // Rename new table
  db.exec("ALTER TABLE users_new RENAME TO users;");
};
export const version = 2;
export const name = "add_phone";
