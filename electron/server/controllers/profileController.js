import { getDB } from "../db/database.js";

// Update user profile picture
export const updateProfilePicture = (req, res) => {
  const { userId, profilePicture } = req.body;

  if (!userId || !profilePicture) {
    return res.status(400).json({
      success: false,
      error: "User ID and profile picture path are required",
    });
  }

  try {
    const db = getDB();
    const stmt = db.prepare(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
    );
    const result = stmt.run(profilePicture, userId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get updated user
    const user = db
      .prepare(
        "SELECT id, name, email, profile_picture, created_at FROM users WHERE id = ?",
      )
      .get(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user profile
export const getProfile = (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "User ID is required",
    });
  }

  try {
    const db = getDB();
    const user = db
      .prepare(
        "SELECT id, name, email, profile_picture, created_at FROM users WHERE id = ?",
      )
      .get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
