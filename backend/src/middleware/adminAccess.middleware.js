import ApiError from "../utils/ApiError.js";
import { validateAdminSession } from "../services/adminAccess.service.js";

export async function requireAdminSession(req, _res, next) {
  try {
    const token = req.get("X-Admin-Session");
    if (await validateAdminSession(req.user.uid, token)) return next();
    return next(
      new ApiError(403, "The admin security session is missing or expired."),
    );
  } catch (error) {
    return next(error);
  }
}
