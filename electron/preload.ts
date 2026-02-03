import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
// contextBridge.exposeInMainWorld("ipcRenderer", {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args;
//     return ipcRenderer.on(channel, (event, ...args) =>
//       listener(event, ...args),
//     );
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.off(channel, ...omit);
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.send(channel, ...omit);
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.invoke(channel, ...omit);
//   },

//   // You can expose other APTs you need here.
//   // ...
// });

contextBridge.exposeInMainWorld("ipcRenderer", {
  on(channel: string, listener: (event: any, ...args: any[]) => void) {
    ipcRenderer.on(channel, listener);
  },
  off(channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.off(channel, listener);
  },
  send(channel: string, ...args: any[]) {
    ipcRenderer.send(channel, ...args);
  },
  invoke(channel: string, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args);
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  // Get server port
  getServerPort: () => ipcRenderer.invoke("get-server-port"),

  // File operations
  selectFile: () => ipcRenderer.invoke("dialog:openFile"),
  copyToProfiles: (sourcePath: string, userId: number) =>
    ipcRenderer.invoke("file:copyToProfiles", sourcePath, userId),
  getProfilePictureData: (relativePath: string) =>
    ipcRenderer.invoke("file:getProfilePictureData", relativePath),
  saveImageToCameraRole: (
    imageData: ArrayBuffer,
    mimeType: string,
    userId: number,
  ) => ipcRenderer.invoke("file:saveCameraPhoto", imageData, mimeType, userId),
  showSystemNotification: (title: string, body: string) =>
    ipcRenderer.invoke("system-notify", { title, body }),

  // Screenshot operations
  captureScreenshot: () => ipcRenderer.invoke("screenshot:capture"),
  saveScreenshot: (dataUrl: string) =>
    ipcRenderer.invoke("screenshot:save", dataUrl),
  listScreenshots: () => ipcRenderer.invoke("screenshot:listScreenshot"),
  getScreenshotImage: (filename: string) =>
    ipcRenderer.invoke("screenshot:getImage", filename),
  deleteScreenshot: (filename: string) =>
    ipcRenderer.invoke("screenshot:delete", filename),
});
