import express from "express";
import cors from "cors";
import detectPort from "detect-port";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { initializeDatabase } from "./db/database.js";

const app = express();
let SERVER_PORT = null;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(authRoutes);
app.use("/api/profile", profileRoutes);

// Start server with dynamic port detection
export async function startServer(userDataPath) {
  // Initialize database with the path from main process
  initializeDatabase(userDataPath);

  // Find available port starting from 3000
  const port = await detectPort(3000);
  SERVER_PORT = port;

  app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
  });

  return port;
}

export function getServerPort() {
  return SERVER_PORT;
}

export default app;
