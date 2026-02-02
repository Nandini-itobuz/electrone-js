import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});

// Listen for navigation events from tray menu
window.ipcRenderer.on("navigate", (_event, path: string) => {
  console.log(`Navigating to: ${path}`);
  window.location.hash = path;
});
