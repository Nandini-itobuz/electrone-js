import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";

export class TrayManager {
  private tray: Tray | null = null;
  private window: BrowserWindow;
  private publicPath: string;

  constructor(window: BrowserWindow, publicPath: string) {
    this.window = window;
    this.publicPath = publicPath;
  }

  public initialize(): void {
    // Get icon path
    const iconPath = path.join(this.publicPath, "test.png");

    // Check if file exists
    if (!fs.existsSync(iconPath)) {
      console.log("Tray icon not found");
      return;
    }

    // Create icon
    const icon = nativeImage.createFromPath(iconPath);
    const trayIcon = icon.resize({ width: 35, height: 35 });

    // Create tray
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip("demo");

    // Create menu
    const menu = this.createMenu();
    this.tray.setContextMenu(menu);

    // Setup click handlers
    this.setupClickHandlers();

    console.log("Tray icon created successfully");
  }

  private createMenu(): Menu {
    return Menu.buildFromTemplate([
      {
        label: "Show App",
        click: () => {
          this.window.show();
          this.window.focus();
        },
      },
      {
        label: "Hide App",
        click: () => {
          this.window.hide();
        },
      },
      { type: "separator" },
      {
        label: "Dashboard",
        click: () => {
          this.window.show();
          this.window.webContents.send("navigate", "/dashboard");
        },
      },
      {
        label: "Profile",
        click: () => {
          this.window.show();
          this.window.webContents.send("navigate", "/profile");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          this.destroy();
          app.quit();
        },
      },
    ]);
  }

  private setupClickHandlers(): void {
    if (!this.tray) return;

    // Platform-specific click behavior
    if (process.platform === "darwin") {
      // macOS: single click toggles window
      this.tray.on("click", () => {
        if (this.window.isVisible()) {
          this.window.hide();
        } else {
          this.window.show();
          this.window.focus();
        }
      });
    } else if (process.platform === "win32") {
      // Windows: double-click shows window
      this.tray.on("double-click", () => {
        this.window.show();
        this.window.focus();
      });
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  public updateIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath);
      const trayIcon = icon.resize({ width: 35, height: 35 });
      this.tray.setImage(trayIcon);
    }
  }

  public updateTooltip(tooltip: string): void {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }
}
