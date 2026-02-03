export interface ElectronAPI {
  getServerPort: () => Promise<number>;
  selectFile: () => Promise<string | null>;
  copyToProfiles: (sourcePath: string, userId: number) => Promise<string>;
  getProfilePictureData: (relativePath: string) => Promise<string | null>;
  saveImageToCameraRole: (
    imageData: ArrayBuffer,
    mimeType: string,
    userId: number,
  ) => Promise<string | null>;
  showSystemNotification: (title, body) => Promise<string | null>;
  captureScreenshot: () => Promise<string>;
  saveScreenshot: (dataUrl: string) => Promise<string | null>;
  listScreenshots: () => Promise<
    Array<{
      filename: string;
      path: string;
      timestamp: number;
      fullPath: string;
    }>
  >;
  getScreenshotImage: (filename: string) => Promise<string | null>;
  deleteScreenshot: (filename: string) => Promise<boolean>;
}

export interface IpcRenderer {
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  off(channel: string, listener: (...args: any[]) => void): void;
  send(channel: string, ...args: any[]): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipcRenderer: IpcRenderer;
  }
}
