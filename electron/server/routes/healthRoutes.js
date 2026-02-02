import express from "express";
import { healthCheck } from "../controllers/healthController.js";

const router = express.Router();

// GET /health
router.get("/health", healthCheck);

export default router;
