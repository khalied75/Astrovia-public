import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests. Please try again later." } },
});

export const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 80,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many write requests. Please slow down." } },
});

export const adminUnlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many admin unlock attempts. Try again later." },
  },
});
