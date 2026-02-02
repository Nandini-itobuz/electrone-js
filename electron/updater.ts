import { BrowserWindow, dialog } from "electron";
import { autoUpdater } from "electron-updater";

export function autoUpdaterConfig(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false; //don't auto download asks first.
  autoUpdater.autoInstallOnAppQuit = true; //installs when app quits.

  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 4000);

  autoUpdater.on("update-available", (info) => {
    console.log("Update available", info.version);

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `A new version ${info.version} is available. Download now?`,
        buttons: ["Yes", "Later"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available.");
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    console.log(`Download progress: ${percent}%`);
    mainWindow.setProgressBar(percent / 100);
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message: "Updated Download, Restart now to install.",
        buttons: ["Restart", "Later"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (error) => {
    console.error("Auto Update error", error);
  });
}
