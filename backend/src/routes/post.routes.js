import { Router } from "express";
import * as controller from "../controllers/post.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.get("/", optionalAuth, controller.index);
router.get("/mine", requireAuth, controller.mine);
router.get("/saved", requireAuth, controller.saved);
router.get("/questions", optionalAuth, controller.questions);
router.get("/:postId", optionalAuth, controller.show);
router.get("/:postId/comments", controller.comments);
router.get("/:postId/comments/:commentId/replies", controller.replies);
router.post("/", requireAuth, writeLimiter, controller.create);
router.patch("/:postId", requireAuth, writeLimiter, controller.update);
router.delete("/:postId", requireAuth, writeLimiter, controller.remove);
router.post("/:postId/like", requireAuth, writeLimiter, controller.like);
router.post("/:postId/save", requireAuth, writeLimiter, controller.save);
router.post("/:postId/comments", requireAuth, writeLimiter, controller.comment);
router.post(
  "/:postId/comments/:commentId/replies",
  requireAuth,
  writeLimiter,
  controller.reply,
);
router.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  writeLimiter,
  controller.removeComment,
);
router.delete(
  "/:postId/comments/:commentId/replies/:replyId",
  requireAuth,
  writeLimiter,
  controller.removeReply,
);
export default router;
