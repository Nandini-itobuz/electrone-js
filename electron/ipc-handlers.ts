import {
  ipcMain,
  dialog,
  Notification,
  BrowserWindow,
  screen,
  desktopCapturer,
} from "electron";
import path from "node:path";
import fs from "node:fs";

export function setupIpcHandlers(
  win: BrowserWindow,
  serverPort: number,
  storagePath: string,
  profilesPath: string,
): void {
  // Get server port
  ipcMain.handle("get-server-port", () => {
    return serverPort;
  });

  // File picker
  ipcMain.handle("dialog:openFile", async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }],
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  });

  // Copy file to profiles
  ipcMain.handle(
    "file:copyToProfiles",
    async (_, sourcePath: string, userId: number) => {
      try {
        const ext = path.extname(sourcePath);
        const filename = `user-${userId}-${Date.now()}${ext}`;
        const destPath = path.join(profilesPath, filename);

        fs.copyFileSync(sourcePath, destPath);

        return `profiles/${filename}`;
      } catch (error) {
        console.error("Error copying file:", error);
        throw error;
      }
    },
  );

  // Get profile picture data
  ipcMain.handle("file:getProfilePictureData", (_, relativePath: string) => {
    if (!relativePath) return null;

    try {
      const fullPath = path.join(storagePath, relativePath);
      const imageBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();

      // Determine MIME type
      let mimeType = "image/jpeg";
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".webp") mimeType = "image/webp";

      // Convert to base64
      const base64 = imageBuffer.toString("base64");
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("Error reading profile picture:", error);
      return null;
    }
  });

  // System notifications
  ipcMain.handle("system-notify", async (_, { title, body }) => {
    const notification = new Notification({ title, body });
    notification.show();
  });

  // Screenshot capture
  ipcMain.handle("screenshot:capture", async () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width, height },
      });

      if (sources.length === 0) {
        throw new Error("No screen sources available");
      }

      // Get the first screen (primary display) and convert to PNG buffer
      const source = sources[0];
      const pngBuffer = source.thumbnail.toPNG();
      const base64Data = pngBuffer.toString("base64");
      return `data:image/png;base64,${base64Data}`;
    } catch (error) {
      console.error("Screenshot capture error:", error);
      throw error;
    }
  });

  // Screenshot save
  ipcMain.handle("screenshot:save", async (_, dataUrl: string) => {
    const result = await dialog.showSaveDialog(win, {
      defaultPath: `screenshot-${Date.now()}.png`,
      filters: [{ name: "Images", extensions: ["png"] }],
    });

    if (!result.canceled && result.filePath) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(result.filePath, buffer);
      return result.filePath;
    }
    return null;
  });
}
