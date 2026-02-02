import { Router } from "express";
import * as authController from "../controllers/authController.js";

const router = Router();

// Auth routes
router.post("/api/auth/register", authController.register);
router.post("/api/auth/login", authController.login);

export default router;
