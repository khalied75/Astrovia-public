import { auth } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import { isProduction } from "../config/env.js";

export async function requireAuth(req, _res, next) {
  try {
    const match = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
    if (!match) throw new ApiError(401, "A Firebase ID token is required.");
    req.user = await auth.verifyIdToken(match[1].trim(), isProduction);
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (!isProduction)
      console.error(
        `[firebase-auth] ${error.code || "unknown"}: ${error.message}`,
      );
    return next(
      new ApiError(401, "The Firebase ID token is invalid or expired."),
    );
  }
}

export async function optionalAuth(req, _res, next) {
  const match = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return next();

  try {
    req.user = await auth.verifyIdToken(match[1].trim(), isProduction);
    return next();
  } catch (error) {
    if (!isProduction) {
      console.error(
        `[firebase-auth] ${error.code || "unknown"}: ${error.message}`,
      );
    }
    return next(
      new ApiError(401, "The Firebase ID token is invalid or expired."),
    );
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.admin === true) return next();
  return next(new ApiError(403, "Administrator access is required."));
}
