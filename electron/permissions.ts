import { app } from "electron";

export function setupPermissions(): void {
  // Handle permission requests globally
  app.on("web-contents-created", (_, contents) => {
    contents.session.setPermissionRequestHandler((_, permission, callback) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
      ];
      callback(allowedPermissions.includes(permission));
    });
  });
}
