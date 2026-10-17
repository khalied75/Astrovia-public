import { Router } from "express";
import {
  changeFollow,
  editCurrentUser,
  showFollowers,
  showFollowing,
  showUser,
  showUserPosts,
} from "../controllers/user.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.get("/:userId/posts", optionalAuth, showUserPosts);
router.get("/:userId/followers", showFollowers);
router.get("/:userId/following", showFollowing);
router.get("/:userId", optionalAuth, showUser);
router.post("/:userId/follow", requireAuth, writeLimiter, changeFollow);
router.patch("/me/profile", requireAuth, writeLimiter, editCurrentUser);
export default router;
