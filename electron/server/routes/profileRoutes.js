import express from "express";
import {
  updateProfilePicture,
  getProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/:userId", getProfile);
router.put("/picture", updateProfilePicture);

export default router;
