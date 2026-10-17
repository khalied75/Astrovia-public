import { Router } from "express";
import { getCurrentUser } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/me", requireAuth, getCurrentUser);
export default router;
