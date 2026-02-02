import * as authModel from "../models/authModel.js";

// Register user
export function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    if (authModel.emailExists(email)) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const userId = authModel.registerUser(name, email, password);
    res.status(201).json({
      success: true,
      data: { id: userId },
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Login user
export function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = authModel.loginUser(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      data: user,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
