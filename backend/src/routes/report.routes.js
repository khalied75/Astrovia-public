import { Router } from "express";
import * as controller from "../controllers/report.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";
import { requireAdminSession } from "../middleware/adminAccess.middleware.js";

const router = Router();
router.get("/", requireAuth, requireAdmin, requireAdminSession, controller.index);
router.post("/posts/:postId", requireAuth, writeLimiter, controller.createPostReport);
router.post(
  "/posts/:postId/comments/:commentId",
  requireAuth,
  writeLimiter,
  controller.createCommentReport,
);
router.post(
  "/posts/:postId/comments/:commentId/replies/:replyId",
  requireAuth,
  writeLimiter,
  controller.createCommentReport,
);
router.patch(
  "/:reportId",
  requireAuth,
  requireAdmin,
  requireAdminSession,
  writeLimiter,
  controller.updateStatus,
);
router.delete(
  "/:reportId/content",
  requireAuth,
  requireAdmin,
  requireAdminSession,
  writeLimiter,
  controller.removeContent,
);
export default router;
