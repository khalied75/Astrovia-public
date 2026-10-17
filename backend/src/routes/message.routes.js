import { Router } from "express";
import { remove } from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.delete(
  "/:conversationId/:messageId",
  requireAuth,
  writeLimiter,
  remove,
);
export default router;
