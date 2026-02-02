import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { startServer } from "./server/index";
import { createWindow } from "./window";
import { TrayManager } from "./tray";
import { setupIpcHandlers } from "./ipc-handlers";
import { setupPermissions } from "./permissions";
import {
  registerGlobalShortcuts,
  unregisterGlobalShortcuts,
} from "./shortcuts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storage paths
export const USER_DATA_PATH = app.getPath("userData");
export const DOCUMENTS_PATH = app.getPath("documents");
export const DOWNLOADS_PATH = app.getPath("downloads");

const STORAGE_PATH = path.join(USER_DATA_PATH, "storage");
const PROFILES_PATH = path.join(STORAGE_PATH, "profiles");

// Create directories
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}
if (!fs.existsSync(PROFILES_PATH)) {
  fs.mkdirSync(PROFILES_PATH, { recursive: true });
}

// Build paths
process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let serverPort: number;
let trayManager: TrayManager | null = null;

// Setup permissions
setupPermissions();

// Quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

// Re-create window on macOS when dock icon is clicked
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    win = createWindow(
      path.join(__dirname, "preload.mjs"),
      process.env.VITE_PUBLIC!,
      VITE_DEV_SERVER_URL,
      RENDERER_DIST,
    );
  }
});

// App ready
app.whenReady().then(async () => {
  // Start server
  serverPort = await startServer(USER_DATA_PATH);

  // Create window
  win = createWindow(
    path.join(__dirname, "preload.mjs"),
    process.env.VITE_PUBLIC!,
    VITE_DEV_SERVER_URL,
    RENDERER_DIST,
  );

  // Setup IPC handlers
  setupIpcHandlers(win, serverPort, STORAGE_PATH, PROFILES_PATH);

  // Setup tray
  trayManager = new TrayManager(win, process.env.VITE_PUBLIC!);
  trayManager.initialize();

  // Register global shortcuts
  registerGlobalShortcuts(win);
});

// Cleanup shortcuts when app is quitting
app.on("will-quit", () => {
  unregisterGlobalShortcuts();
});
