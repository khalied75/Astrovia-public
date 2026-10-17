import { Router } from "express";
import * as controller from "../controllers/adminAccess.controller.js";
import { requireAdminSession } from "../middleware/adminAccess.middleware.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { adminUnlockLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/status", controller.status);
router.post("/setup", adminUnlockLimiter, controller.setup);
router.post("/unlock", adminUnlockLimiter, controller.unlock);
router.get("/session", requireAdminSession, controller.verify);
router.delete("/session", requireAdminSession, controller.lock);

export default router;
