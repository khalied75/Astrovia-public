import ApiError from "../utils/ApiError.js";
import { isProduction } from "../config/env.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found.`));
}

export function errorHandler(error, _req, res, _next) {
  const uploadError = error.name === "MulterError";
  const status = Number(error.status) || (uploadError ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    error: {
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "The image must be 10 MB or smaller."
          : status === 500 && isProduction
            ? "Internal server error."
            : error.message,
      ...(error.details && { details: error.details }),
      ...(!isProduction && status === 500 && { stack: error.stack }),
    },
  });
}
