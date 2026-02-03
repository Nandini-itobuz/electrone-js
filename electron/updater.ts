import { BrowserWindow, dialog } from "electron";
import { autoUpdater } from "electron-updater";

export function autoUpdaterConfig(mainWindow: BrowserWindow): void {
  console.log("=== Auto-updater initialized ===");

  autoUpdater.autoDownload = false; //don't auto download asks first.
  autoUpdater.autoInstallOnAppQuit = true; //installs when app quits.

  // Log all events for debugging
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
  });

  setTimeout(() => {
    console.log("Starting update check...");
    autoUpdater.checkForUpdates();
  }, 4000);

  autoUpdater.on("update-available", (info) => {
    console.log("✅ Update available:", info.version);
    console.log("Update info:", JSON.stringify(info, null, 2));

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `A new version ${info.version} is available. Download now?`,
        buttons: ["Yes", "Later"],
        defaultId: 0,
      })
      .then((result) => {
        console.log("User response:", result.response === 0 ? "Yes" : "Later");
        if (result.response === 0) {
          console.log("🔽 Starting download...");
          try {
            autoUpdater.downloadUpdate();
            console.log("Download command sent successfully");
          } catch (error) {
            console.error("Error calling downloadUpdate:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Dialog error:", error);
      });
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("❌ No updates available");
    console.log("Current version:", info.version);
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    const logMessage = `📥 Download progress: ${percent}% (${progress.transferred}/${progress.total} bytes)`;
    console.log(logMessage);
    mainWindow.webContents.send("update-log", logMessage);
    mainWindow.setProgressBar(percent / 100);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("✅ Update downloaded successfully!");
    console.log("Downloaded version:", info.version);
    mainWindow.setProgressBar(-1); // Remove progress bar

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message: "Update downloaded successfully! Restart now to install?",
        buttons: ["Restart", "Later"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          console.log("🔄 Restarting to install update...");
          autoUpdater.quitAndInstall();
        } else {
          console.log("User chose to restart later");
        }
      });
  });

  autoUpdater.on("error", (error) => {
    console.error("❌ Auto Update error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  });
}
