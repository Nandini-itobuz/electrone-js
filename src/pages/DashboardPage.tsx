import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/dashboard.scss";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [screenshots, setScreenshots] = useState<
    { filename: string; fullPath: string; timestamp: number; path: string }[]
  >([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    loadScreenshots();
  }, [navigate]);

  console.log(screenshots);
  const loadScreenshots = async () => {
    try {
      const list = await window.electronAPI.listScreenshots();
      setScreenshots(list);
    } catch (error) {
      console.error("Failed to load screenshots:", error);
    }
  };

  const viewScreenshot = async (filename: string) => {
    try {
      const imageData = await window.electronAPI.getScreenshotImage(filename);
      setSelectedImage(imageData);
    } catch (error) {
      console.error("Failed to load screenshot image:", error);
    }
  };

  const deleteScreenshot = async (filename: string) => {
    try {
      const success = await window.electronAPI.deleteScreenshot(filename);
      if (success) {
        window.electronAPI.showSystemNotification(
          "Screenshot Deleted",
          "Screenshot removed successfully",
        );
        loadScreenshots();
      }
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleScreenshot = async () => {
    try {
      // Capture screenshot from main process
      const dataUrl = await window.electronAPI.captureScreenshot();

      // Save the screenshot
      const savedPath = await window.electronAPI.saveScreenshot(dataUrl);

      if (savedPath) {
        window.electronAPI.showSystemNotification(
          "Screenshot Saved",
          `Saved to: ${savedPath}`,
        );
        loadScreenshots(); // Refresh the list
      }
    } catch (error) {
      console.error("Screenshot error:", error);
      alert("Failed to take screenshot");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h1>Welcome, {user.name}!</h1>

          <div className="user-info">
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value">{user.id}</span>
            </div>
            <div className="info-row">
              <span className="label">Member Since:</span>
              <span className="value">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="btn-profile"
            >
              View Profile
            </button>

            <button onClick={handleScreenshot} className="btn-screenshot">
              📸 Take Screenshot
            </button>
          </div>

          {/* Screenshots Table */}
          {screenshots.length > 0 && (
            <div className="screenshots-section">
              <div className="screenshots-header">
                <h2>My Screenshots</h2>
                <span className="screenshot-badge">
                  {screenshots.length} screenshot
                  {screenshots.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Filename</th>
                      <th>Date & Time</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenshots.map((screenshot, index) => (
                      <tr
                        key={screenshot.filename}
                        style={{
                          animation: `fadeIn 0.3s ease-in ${index * 0.05}s both`,
                        }}
                      >
                        <td className="row-number">{index + 1}</td>
                        <td className="filename-cell">
                          <div className="filename-content">
                            <span className="icon">📸</span>
                            <span className="filename-text">
                              {screenshot.filename}
                            </span>
                          </div>
                        </td>
                        <td className="date-cell">
                          {new Date(screenshot.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="actions-cell">
                          <button
                            onClick={() => viewScreenshot(screenshot.filename)}
                            className="btn-view"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() =>
                              deleteScreenshot(screenshot.filename)
                            }
                            className="btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Image Modal */}
          {selectedImage && (
            <div className="image-modal" onClick={() => setSelectedImage(null)}>
              <div className="modal-content">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="btn-close"
                >
                  ✕ Close
                </button>
                <img
                  src={selectedImage}
                  alt="Screenshot"
                  className="modal-image"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
