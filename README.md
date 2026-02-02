# Electron + React + TypeScript + Vite

Electron desktop application with React frontend, Express API server, and SQLite database using better-sqlite3.

## Project Structure

```
electron/
├── main.ts                  # Main Electron process
├── preload.ts              # Preload script
└── server/
    ├── index.js            # Express server
    ├── db/
    │   └── database.js     # SQLite connection & initialization
    ├── models/             # Database queries (SQL)
    ├── controllers/        # Business logic
    └── routes/             # API endpoints

src/                        # React frontend
```

## Setup

```bash
npm install
npx electron-rebuild -f -w better-sqlite3
npm run dev
```

## Native Modules in Electron

This project uses `better-sqlite3`, which is a **native Node.js module** containing compiled C++ code.

### Why Rebuild is Needed

Native modules are compiled as binary `.node` files that are version-specific:

1. **npm install** compiles native modules for your system's Node.js version (e.g., MODULE_VERSION 127)
2. **Electron** uses its own embedded Node.js version (e.g., MODULE_VERSION 123)
3. A binary compiled for Node.js v22 won't work in Electron's Node.js v20

**The error you'll see without rebuilding:**

```
was compiled against a different Node.js version using NODE_MODULE_VERSION 127
This version of Node.js requires NODE_MODULE_VERSION 123
```

### Solution: Rebuild Native Modules

After installing dependencies, rebuild native modules for Electron:

```bash
# Rebuild specific module
npx electron-rebuild -f -w better-sqlite3

# Or rebuild all native modules
npx electron-rebuild
```

**When to rebuild:**

- After `npm install`
- After updating Electron version
- After updating native module versions (better-sqlite3, serialport, etc.)
- When you get "NODE_MODULE_VERSION mismatch" errors

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (body: `{name, email}`)
- `PUT /api/users/:id` - Update user (body: `{name, email}`)
- `DELETE /api/users/:id` - Delete user

## Database

SQLite database is stored in the app's user data directory:

- **macOS**: `~/Library/Application Support/electron-vite-project/database.db`
- **Windows**: `%APPDATA%/electron-vite-project/database.db`
- **Linux**: `~/.config/electron-vite-project/database.db`

## Development

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run lint       # Run ESLint
```

## Native Features Integration

### Camera Access

**Modules/APIs Used:**

- **`navigator.mediaDevices.getUserMedia()`** - Web API to access camera/microphone. Works in both browsers and Electron
- **`MediaStream`** - Represents live video/audio feed from camera
- **`HTMLVideoElement.srcObject`** - Connects media stream to video element for live preview
- **`HTMLCanvasElement`** - Used to capture single frame from video stream
- **`canvas.toBlob()`** - Converts canvas image to binary blob (JPEG/PNG)

**Detailed Flow:**

```
User clicks "Open Camera"
    ↓
1. RENDERER: navigator.mediaDevices.getUserMedia() called
    ↓
2. BROWSER: Shows permission dialog ("Allow camera access?")
    ↓ (Permission Granted)
3. BROWSER: Returns MediaStream object (live video feed)
    ↓
4. RENDERER: Store stream in ref (streamRef.current = stream)
    ↓
5. RENDERER: Set showCamera state to true → Modal renders
    ↓
6. RENDERER: After 100ms timeout (wait for React render)
    ↓
7. RENDERER: Set videoRef.current.srcObject = stream
    ↓
8. BROWSER: Video element displays live camera feed
    ↓
------- User sees themselves in the camera -------
    ↓
User clicks "Capture"
    ↓
9. RENDERER: Create canvas element (document.createElement('canvas'))
    ↓
10. RENDERER: Set canvas size to match video dimensions
    ↓
11. RENDERER: ctx.drawImage(videoRef.current, 0, 0)
    - Freezes current video frame onto canvas
    ↓
12. RENDERER: canvas.toBlob(callback, 'image/jpeg', 0.95)
    - Converts canvas to compressed JPEG blob
    ↓
13. RENDERER: blob.arrayBuffer() → Convert to ArrayBuffer
    - Binary format that can be sent via IPC
    ↓
14. RENDERER: window.electronAPI.saveCameraPhoto(arrayBuffer, blob.type, userId)
    ↓
15. PRELOAD: ipcRenderer.invoke("file:saveCameraPhoto", ...)
    ↓
16. MAIN: ipcMain.handle receives ArrayBuffer
    ↓
17. MAIN: Buffer.from(arrayBuffer) → Convert to Node.js Buffer
    ↓
18. MAIN: Generate filename: "camera-{userId}-{timestamp}.jpg"
    ↓
19. MAIN: fs.writeFileSync(filepath, buffer)
    - Saves JPEG to storage/profiles/ directory
    ↓
20. MAIN: Returns relative path: "profiles/camera-123-1234567890.jpg"
    ↓
21. RENDERER: Receives savedPath from IPC
    ↓
22. RENDERER: fetch() to PUT /api/profile/picture
    - Sends { userId, profilePicture: savedPath } to Express API
    ↓
23. EXPRESS: Updates database (UPDATE users SET profile_picture = ?)
    ↓
24. EXPRESS: Returns updated user object
    ↓
25. RENDERER: Updates localStorage and state with new user data
    ↓
26. RENDERER: closeCamera() → Stops MediaStream tracks
    ↓
27. RENDERER: Next useEffect triggers → Loads new profile picture
    ↓
28. RENDERER: window.electronAPI.getProfilePictureData(relativePath)
    ↓
29. MAIN: fs.readFileSync() → Reads file as Buffer
    ↓
30. MAIN: buffer.toString('base64') → Convert to base64 string
    ↓
31. MAIN: Returns "data:image/jpeg;base64,{base64data}"
    ↓
32. RENDERER: Sets <img src={dataUrl} />
    ↓
✅ Profile picture updated and displayed!
```

**Why setTimeout(100)?**
React's state update (`setShowCamera(true)`) schedules a re-render but doesn't immediately create the DOM elements. The timeout ensures the `<video>` element exists in the DOM before we try to access `videoRef.current`.

### File Upload

**Modules/APIs Used:**

- **`electron.dialog.showOpenDialog()`** - Native file picker dialog
- **`fs.copyFileSync()`** - Node.js file system to copy files
- **`fs.readFileSync()`** - Read file as binary buffer
- **`Buffer.toString('base64')`** - Convert binary to base64 for renderer display
- **`ipcMain.handle()` / `ipcRenderer.invoke()`** - Communication between main and renderer process

**Detailed Flow:**

```
User clicks "Upload Profile Picture"
    ↓
1. RENDERER: window.electronAPI.selectFile()
    ↓
2. PRELOAD: ipcRenderer.invoke("dialog:openFile")
    ↓
3. MAIN: ipcMain.handle("dialog:openFile") receives request
    ↓
4. MAIN: dialog.showOpenDialog() called with filters
    - Filters: ['jpg', 'jpeg', 'png', 'webp']
    ↓
5. OS: Shows native file picker dialog
    ↓
------- User selects a file -------
    ↓
6. OS: Returns file path (e.g., "/Users/john/Desktop/photo.jpg")
    ↓
7. MAIN: Returns filePath to renderer
    ↓
8. RENDERER: Receives selectedFile path
    ↓
9. RENDERER: window.electronAPI.copyToProfiles(selectedFile, userId)
    ↓
10. PRELOAD: ipcRenderer.invoke("file:copyToProfiles", ...)
    ↓
11. MAIN: ipcMain.handle receives (sourcePath, userId)
    ↓
12. MAIN: Extract file extension (path.extname)
    ↓
13. MAIN: Generate unique filename: "user-{userId}-{timestamp}.jpg"
    ↓
14. MAIN: Construct destination path
    - PROFILES_PATH/user-123-1234567890.jpg
    ↓
15. MAIN: fs.copyFileSync(sourcePath, destPath)
    - Copies file from user's location to app storage
    ↓
16. MAIN: Returns relative path: "profiles/user-123-1234567890.jpg"
    ↓
17. RENDERER: Receives relativePath
    ↓
18. RENDERER: fetch() to PUT /api/profile/picture
    - Sends { userId, profilePicture: relativePath } to Express
    ↓
19. EXPRESS: db.prepare("UPDATE users SET profile_picture = ? WHERE id = ?")
    ↓
20. EXPRESS: stmt.run(relativePath, userId)
    - Updates database with new file path
    ↓
21. EXPRESS: Query updated user data
    ↓
22. EXPRESS: Returns { success: true, data: { ...user } }
    ↓
23. RENDERER: Updates localStorage with new user data
    ↓
24. RENDERER: setUser(data.data) → Triggers useEffect
    ↓
25. RENDERER: useEffect sees profile_picture changed
    ↓
26. RENDERER: Calls loadProfilePicture(relativePath)
    ↓
27. RENDERER: window.electronAPI.getProfilePictureData(relativePath)
    ↓
28. PRELOAD: ipcRenderer.invoke("file:getProfilePictureData", ...)
    ↓
29. MAIN: ipcMain.handle receives relativePath
    ↓
30. MAIN: Constructs full path from STORAGE_PATH + relativePath
    ↓
31. MAIN: fs.readFileSync(fullPath) → Reads file as Buffer
    ↓
32. MAIN: Detects MIME type based on file extension
    - .jpg/.jpeg → image/jpeg
    - .png → image/png
    - .webp → image/webp
    ↓
33. MAIN: buffer.toString('base64') → Convert to base64
    ↓
34. MAIN: Returns data URL: "data:{mimeType};base64,{base64data}"
    ↓
35. RENDERER: setProfilePicUrl(dataUrl)
    ↓
36. RENDERER: <img src={profilePicUrl} /> renders image
    ↓
✅ Profile picture uploaded and displayed!
```

**Why Base64 Data URLs?**
Electron's renderer process (like a web browser) cannot directly access file paths like `file:///path/to/image.jpg` due to security restrictions. Converting to base64 data URLs allows images to be displayed inline in the HTML without file system access.

**Security Note:**
Renderer process cannot directly access file system for security. All file operations happen in main process, and images are sent as base64 data URLs.

### IPC Handlers

```typescript
// Main Process (electron/main.ts)
ipcMain.handle("dialog:openFile", ...)           // Open file picker
ipcMain.handle("file:copyToProfiles", ...)       // Copy file to storage
ipcMain.handle("file:getProfilePictureData", ...)// Read file as base64
ipcMain.handle("file:saveCameraPhoto", ...)      // Save camera capture

// Preload (electron/preload.ts)
contextBridge.exposeInMainWorld("electronAPI", {
  selectFile: () => ipcRenderer.invoke("dialog:openFile"),
  copyToProfiles: (...) => ipcRenderer.invoke("file:copyToProfiles", ...),
  getProfilePictureData: (...) => ipcRenderer.invoke("file:getProfilePictureData", ...),
  saveCameraPhoto: (...) => ipcRenderer.invoke("file:saveCameraPhoto", ...)
})
```

### Storage Paths

Profile pictures stored in:

- **macOS**: `~/Library/Application Support/electron-vite-project/storage/profiles/`
- **Windows**: `%APPDATA%/electron-vite-project/storage/profiles/`
- **Linux**: `~/.config/electron-vite-project/storage/profiles/`
