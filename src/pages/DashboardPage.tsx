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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

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
      }
    } catch (error) {
      console.error("Screenshot error:", error);
      alert("Failed to take screenshot");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome, {user.name}!
          </h1>

          <div className="space-y-4 mb-8">
            <div>
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="ml-2 text-gray-600">{user.email}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">User ID:</span>
              <span className="ml-2 text-gray-600">{user.id}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Member Since:</span>
              <span className="ml-2 text-gray-600">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div
            className={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Logout
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-2.5 bg-coral-600 text-white rounded-lg hover:bg-coral-700 transition-all ml-4"
              style={{ backgroundColor: "#EE5A6F" }}
            >
              View Profile
            </button>

            <button
              onClick={handleScreenshot}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all ml-4"
            >
              📸 Take Screenshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
