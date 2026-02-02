import { getDB } from "../db/database.js";
import bcrypt from "bcrypt";

// Cache database instance
let db = null;
const getDatabase = () => {
  if (!db) db = getDB();
  return db;
};

// Register a new user
export function registerUser(name, email, password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = getDatabase().prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
  );
  const result = stmt.run(name, email, hashedPassword);
  return result.lastInsertRowid;
}

// Login user
export function loginUser(email, password) {
  const stmt = getDatabase().prepare("SELECT * FROM users WHERE email = ?");
  const user = stmt.get(email);

  if (!user) {
    return null; // User not found
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);

  if (!isValidPassword) {
    return null; // Invalid password
  }

  // Don't return password
  return user;
}

// Check if email exists
export function emailExists(email) {
  const stmt = getDatabase().prepare(
    "SELECT COUNT(*) as count FROM users WHERE email = ?",
  );
  const result = stmt.get(email);
  return result.count > 0;
}
