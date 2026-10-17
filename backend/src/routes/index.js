import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";
import authRoutes from "./auth.routes.js";
import postRoutes from "./post.routes.js";
import userRoutes from "./user.routes.js";
import uploadRoutes from "./upload.routes.js";
import reportRoutes from "./report.routes.js";
import messageRoutes from "./message.routes.js";
import adminAccessRoutes from "./adminAccess.routes.js";
import { hasAdminCredentials } from "../config/firebase.js";

const router = Router();
router.use(apiLimiter);
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      service: "astrovia-api",
      firebaseAdmin: hasAdminCredentials
        ? "configured"
        : "credentials-required",
      timestamp: new Date().toISOString(),
    },
  });
});
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/uploads", uploadRoutes);
router.use("/reports", reportRoutes);
router.use("/messages", messageRoutes);
router.use("/admin-access", adminAccessRoutes);
export default router;
