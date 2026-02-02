import { globalShortcut, BrowserWindow } from "electron";

/**
 * Register global keyboard shortcuts
 * These work even when the app doesn't have focus
 */
export function registerGlobalShortcuts(win: BrowserWindow): void {
  // Show/Hide window with Ctrl+Shift+H (or Cmd+Shift+H on macOS)
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  // Toggle DevTools with Ctrl+Shift+I
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    win.webContents.toggleDevTools();
  });

  // Reload app with Ctrl+R
  globalShortcut.register("CommandOrControl+R", () => {
    win.reload();
  });

  // Take screenshot with Ctrl+Shift+S
  globalShortcut.register("CommandOrControl+Shift+S", () => {
    win.webContents.send("trigger-screenshot");
  });

  // Focus app with Ctrl+Shift+F
  globalShortcut.register("CommandOrControl+Shift+F", () => {
    win.show();
    win.focus();
  });

  console.log("Global shortcuts registered:");
  console.log("  Ctrl+Shift+H - Show/Hide window");
  console.log("  Ctrl+Shift+I - Toggle DevTools");
  console.log("  Ctrl+R - Reload app");
  console.log("  Ctrl+Shift+S - Screenshot");
  console.log("  Ctrl+Shift+F - Focus app");
}

/**
 * Unregister all global shortcuts
 * Should be called when app is quitting
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
  console.log("All global shortcuts unregistered");
}

/**
 * Check if a shortcut is registered
 */
export function isShortcutRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator);
}
