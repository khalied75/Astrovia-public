import multer from "multer";
import ApiError from "../utils/ApiError.js";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new ApiError(400, "Only JPG, PNG, WebP, and GIF images are allowed."));
    }
    callback(null, true);
  },
}).single("image");
