# 🚨 Detecting Permission Denial in Renderer Process

## Yes! The renderer process CAN detect when permissions are denied.

When Electron's main process denies a permission, the web APIs in the renderer process will throw errors that you can catch.

---

## 🎯 How It Works

### Main Process (Electron)

```typescript
// In electron/main.ts
win.webContents.session.setPermissionRequestHandler(
  (_, permission, callback) => {
    if (permission === "media") {
      callback(false); // ❌ DENY camera
    }
  },
);
```

### Renderer Process (React/HTML)

```typescript
// In your React component
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  console.log("✅ Camera granted");
} catch (error) {
  // ❌ This error will be thrown because permission was denied!
  alert("Camera access denied!");
}
```

---

## 📋 Common Error Types

### Camera/Microphone Errors

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
} catch (error) {
  if (error.name === "NotAllowedError") {
    // ❌ Permission denied by user or system
    alert("Camera permission denied!");
  } else if (error.name === "NotFoundError") {
    // ❌ No camera found
    alert("No camera detected");
  } else if (error.name === "NotReadableError") {
    // ❌ Camera is being used by another app
    alert("Camera is busy");
  }
}
```

### Notification Errors

```typescript
const permission = await Notification.requestPermission();

if (permission === "denied") {
  // ❌ User denied notifications
  alert("Notifications blocked! Please enable in settings.");
}
```

### Geolocation Errors

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    // ✅ Success
    console.log("Location:", position);
  },
  (error) => {
    // ❌ Error
    if (error.code === error.PERMISSION_DENIED) {
      alert("Location permission denied!");
    }
  },
);
```

---

## 💡 Best Practices

### 1. Always Use Try-Catch

```typescript
const requestCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Use camera
  } catch (error) {
    // Handle error gracefully
    console.error("Camera error:", error);
    alert("Cannot access camera. Please check permissions.");
  }
};
```

### 2. Provide Helpful Error Messages

```typescript
catch (error) {
  if (error.name === 'NotAllowedError') {
    alert(
      'Camera Access Denied!\n\n' +
      'To fix this:\n' +
      '1. Allow camera permission\n' +
      '2. Restart the app'
    );
  }
}
```

### 3. Show UI Feedback

```typescript
const [cameraStatus, setCameraStatus] = useState("not-requested");

try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  setCameraStatus("granted"); // Show green checkmark
} catch (error) {
  setCameraStatus("denied"); // Show red X or warning
}
```

### 4. Check Permission Status First

```typescript
// Check if permission was already denied
const checkPermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: "camera" });

    if (result.state === "denied") {
      alert("Camera was previously denied. Please enable in settings.");
      return;
    }

    // Safe to request camera now
    requestCamera();
  } catch (error) {
    // Permissions API not supported, just try requesting
    requestCamera();
  }
};
```

---

## 🔧 Complete Example

```typescript
import React, { useState } from 'react';

function CameraComponent() {
  const [status, setStatus] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setStatus('Requesting camera...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // ✅ Success!
      setStream(mediaStream);
      setStatus('✅ Camera active');

      // Attach to video element
      const video = document.querySelector('video');
      if (video) {
        video.srcObject = mediaStream;
      }

    } catch (error: any) {
      // ❌ Handle errors
      console.error('Camera error:', error);

      if (error.name === 'NotAllowedError') {
        setStatus('❌ Camera permission denied');
        alert(
          '🚫 Camera Access Denied\n\n' +
          'This app needs camera permission to work.\n\n' +
          'Please:\n' +
          '1. Allow camera access\n' +
          '2. Restart the application'
        );
      } else if (error.name === 'NotFoundError') {
        setStatus('❌ No camera found');
        alert('No camera detected. Please connect a camera and try again.');
      } else {
        setStatus(`❌ Error: ${error.message}`);
        alert(`Camera error: ${error.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setStatus('Camera stopped');
    }
  };

  return (
    <div>
      <h2>Camera Demo</h2>

      {/* Status Display */}
      <div style={{
        padding: '10px',
        backgroundColor: status.includes('✅') ? 'lightgreen' :
                        status.includes('❌') ? 'lightcoral' : 'lightgray',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        {status || 'Ready to start camera'}
      </div>

      {/* Video Display */}
      <video
        autoPlay
        playsInline
        style={{ width: '100%', maxWidth: '500px' }}
      />

      {/* Controls */}
      <div>
        <button onClick={startCamera} disabled={!!stream}>
          Start Camera
        </button>
        <button onClick={stopCamera} disabled={!stream}>
          Stop Camera
        </button>
      </div>
    </div>
  );
}

export default CameraComponent;
```

---

## 🎨 UI/UX Recommendations

### Show Visual Feedback

```typescript
// Show different icons based on permission state
{permissionState === 'granted' && <span>✅</span>}
{permissionState === 'denied' && <span>❌</span>}
{permissionState === 'prompt' && <span>⚠️</span>}
```

### Provide Instructions

```typescript
if (cameraBlocked) {
  return (
    <div className="permission-error">
      <h3>📷 Camera Access Required</h3>
      <p>This feature needs camera permission to work.</p>
      <ol>
        <li>Click the camera icon in the address bar</li>
        <li>Select "Always allow"</li>
        <li>Reload the page</li>
      </ol>
    </div>
  );
}
```

### Graceful Degradation

```typescript
// Disable features that require camera
<button disabled={!cameraAvailable}>
  {cameraAvailable ? 'Take Photo' : 'Camera Not Available'}
</button>
```

---

## 🧪 Testing

To test permission denial:

1. **Set main process to deny:**

```typescript
// electron/main.ts
win.webContents.session.setPermissionRequestHandler(
  (_, permission, callback) => {
    callback(false); // Deny all permissions
  },
);
```

2. **Try to use camera in renderer:**

```typescript
// Should trigger the catch block
try {
  await navigator.mediaDevices.getUserMedia({ video: true });
} catch (error) {
  console.log("Caught error:", error.name); // "NotAllowedError"
}
```

---

## 📊 Error Reference Table

| Permission    | API                              | Error When Denied   | Error Property |
| ------------- | -------------------------------- | ------------------- | -------------- |
| Camera/Mic    | `getUserMedia()`                 | `NotAllowedError`   | `error.name`   |
| Notifications | `requestPermission()`            | Returns `'denied'`  | Return value   |
| Geolocation   | `getCurrentPosition()`           | `PERMISSION_DENIED` | `error.code`   |
| Screen Share  | `getDisplayMedia()`              | `NotAllowedError`   | `error.name`   |
| Clipboard     | `navigator.clipboard.readText()` | `NotAllowedError`   | `error.name`   |

---

## ✅ Summary

**Yes, the renderer process can detect permission denial through:**

1. ✅ **Try-Catch blocks** - Catch errors when APIs fail
2. ✅ **Error.name** - Check specific error types
3. ✅ **Return values** - Some APIs return permission status
4. ✅ **Error callbacks** - Some APIs have error callbacks
5. ✅ **Permissions API** - Query permission status proactively

**Always handle errors gracefully and inform users what went wrong!**
