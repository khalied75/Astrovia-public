import ApiError from "./ApiError.js";

export function text(value, field, { min = 1, max = 1000, optional = false } = {}) {
  if ((value === undefined || value === null || value === "") && optional) return undefined;
  if (typeof value !== "string") throw new ApiError(400, `${field} must be text.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max) {
    throw new ApiError(400, `${field} must be between ${min} and ${max} characters.`);
  }
  return clean;
}

export function optionalUrl(value, field = "mediaUrl") {
  if (!value) return undefined;
  const clean = text(value, field, { max: 2000 });
  try {
    const url = new URL(clean);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new ApiError(400, `${field} must be a valid HTTP URL.`);
  }
}

export function tags(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10) throw new ApiError(400, "tags must be an array of up to 10 items.");
  return [...new Set(value.map((tag) => text(tag, "tag", { max: 30 }).replace(/^#/, "")))];
}
