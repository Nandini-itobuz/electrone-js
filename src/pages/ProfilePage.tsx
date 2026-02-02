import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../utils/notifications";
import "../styles/profile.scss";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface User {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  created_at: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");

  //camera
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  //cropper
  const [showCropper, setShowCropper] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Get API URL
    window.electronAPI.getServerPort().then((port) => {
      setApiUrl(`http://localhost:${port}`);
    });

    // Load profile picture if exists
    if (parsedUser.profile_picture) {
      loadProfilePicture(parsedUser.profile_picture);
    }
  }, [navigate]);

  // Reload profile picture when user changes
  useEffect(() => {
    if (user?.profile_picture) {
      loadProfilePicture(user.profile_picture);
    }
  }, [user?.profile_picture]);

  const loadProfilePicture = async (relativePath: string) => {
    try {
      const dataUrl =
        await window.electronAPI.getProfilePictureData(relativePath);
      if (dataUrl) {
        setProfilePicUrl(dataUrl);
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
    }
  };

  const handleUploadPicture = async () => {
    if (!user) return;

    try {
      setUploading(true);

      // Open file picker
      const selectedFile = await window.electronAPI.selectFile();

      if (!selectedFile) {
        setUploading(false);
        return; // User canceled
      }

      // Copy file to profiles directory
      const relativePath = await window.electronAPI.copyToProfiles(
        selectedFile,
        user.id,
      );

      // Update database via API
      const response = await fetch(`${apiUrl}/api/profile/picture`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          profilePicture: relativePath,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local storage
        localStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);

        // Load new picture
        await loadProfilePicture(relativePath);

        showSuccessNotification("Profile picture updated successfully!");
      } else {
        showErrorNotification(data.error || "Failed to update profile picture");
      }
    } catch (error) {
      const err = error as Error;
      showErrorNotification(err?.message || "Failed to upload picture");
      console.error("Error uploading picture:", error);
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      console.log("Camera stream obtained:", stream);
      console.log("Video tracks:", stream.getVideoTracks());

      streamRef.current = stream;
      setShowCamera(true);

      // Wait for next render cycle to ensure video element exists
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Setting srcObject on video element");
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        } else {
          console.error("videoRef.current is null!");
        }
      }, 100);
    } catch (err) {
      showErrorNotification("Failed to access camera");
      console.error("Camera error:", err);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !user) {
      showErrorNotification("Failed to capture photo");
      return;
    }

    setCapturing(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showErrorNotification("Failed to capture photo");
      setCapturing(false);
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);

    // Convert to data URL for cropper
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(imageDataUrl);

    // Close camera and show cropper
    closeCamera();
    setShowCropper(true);
    setCapturing(false);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturing(false);
  };

  const saveCroppedImage = async () => {
    if (!cropperRef.current || !user) {
      showErrorNotification("Failed to save cropped image");
      return;
    }

    setUploading(true);

    try {
      const cropper = cropperRef.current.cropper;

      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 800, // Max width
        height: 800, // Max height
        imageSmoothingQuality: "high",
      });

      // Convert to blob
      croppedCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            showErrorNotification("Failed to create cropped image");
            setUploading(false);
            return;
          }

          try {
            const arrayBuffer = await blob.arrayBuffer();

            // Save to profiles directory
            const savedPath = await window.electronAPI.saveImageToCameraRole(
              arrayBuffer,
              blob.type,
              user.id,
            );

            // Update database
            const response = await fetch(`${apiUrl}/api/profile/picture`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                profilePicture: savedPath,
              }),
            });

            const data = await response.json();

            if (data.success) {
              localStorage.setItem("user", JSON.stringify(data.data));
              setUser(data.data);

              showSuccessNotification("Profile picture updated!");
              closeCropper();
            } else {
              showErrorNotification(data.error || "Failed to update profile");
            }
          } catch (err) {
            showErrorNotification("Failed to save photo");
            console.error(err);
          } finally {
            setUploading(false);
          }
        },
        "image/jpeg",
        0.9,
      );
    } catch (err) {
      showErrorNotification("Failed to crop image");
      console.error(err);
      setUploading(false);
    }
  };

  const closeCropper = () => {
    setShowCropper(false);
    setCapturedImage(null);
    setUploading(false);
  };

  if (!user) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-card">
          <h1>My Profile</h1>

          <div className="profile-picture-section">
            <div className="picture-wrapper">
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="no-picture">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <button
                onClick={handleUploadPicture}
                disabled={uploading}
                className="upload-button"
              >
                {uploading ? "Uploading..." : "Upload Profile Picture"}
              </button>

              <button
                disabled={uploading}
                className="upload-button"
                onClick={openCamera}
              >
                Open Camera
              </button>
            </div>
          </div>

          <div className="user-info">
            <div className="info-row">
              <span className="label">Name</span>
              <span className="value">{user.name}</span>
            </div>

            <div className="info-row">
              <span className="label">Email</span>
              <span className="value">{user.email}</span>
            </div>

            <div className="info-row">
              <span className="label">Member Since</span>
              <span className="value">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="back-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal-overlay" onClick={closeCamera}>
          <div
            className="camera-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-preview"
            />
            <div className="camera-controls">
              <button
                onClick={capturePhoto}
                disabled={capturing}
                className="capture-button"
              >
                {capturing ? "Capturing..." : "Capture"}
              </button>
              <button
                onClick={closeCamera}
                disabled={capturing}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && capturedImage && (
        <div className="camera-modal-overlay" onClick={closeCropper}>
          <div
            className="cropper-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Crop Your Photo</h2>
            <Cropper
              ref={cropperRef}
              src={capturedImage}
              style={{ height: 400, width: "100%" }}
              aspectRatio={1}
              guides={true}
              viewMode={1}
              dragMode="move"
              scalable={true}
              cropBoxMovable={true}
              cropBoxResizable={true}
              background={false}
            />
            <div className="camera-controls">
              <button
                onClick={saveCroppedImage}
                disabled={uploading}
                className="capture-button"
              >
                {uploading ? "Saving..." : "Save Photo"}
              </button>
              <button
                onClick={closeCropper}
                disabled={uploading}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
