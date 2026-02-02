import { BrowserWindow } from "electron";
import path from "node:path";

export function createWindow(
  preloadPath: string,
  publicPath: string,
  devServerUrl: string | undefined,
  rendererDist: string,
): BrowserWindow {
  const win = new BrowserWindow({
    icon: path.join(publicPath, "electron-vite.svg"),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Enable media permissions
  win.webContents.session.setPermissionRequestHandler(
    (_, permission, callback) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
      ];
      callback(allowedPermissions.includes(permission));
    },
  );

  // Send message when page loads
  win.webContents.on("did-finish-load", () => {
    win.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Load URL or file
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(rendererDist, "index.html"));
  }

  return win;
}
