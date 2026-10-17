import { Router } from "express";
import {
  uploadMessageImage,
  uploadPostImage,
  uploadProfileImage,
} from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";
import { uploadImage } from "../middleware/upload.middleware.js";

const router = Router();
router.post("/images", requireAuth, writeLimiter, uploadImage, uploadPostImage);
router.post("/profile-image", requireAuth, writeLimiter, uploadImage, uploadProfileImage);
router.post("/message-image", requireAuth, writeLimiter, uploadImage, uploadMessageImage);
export default router;
