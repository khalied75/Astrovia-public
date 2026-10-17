import { randomUUID } from "node:crypto";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function saveImage(file, uid, folder) {
  if (!file) {
    throw new ApiError(400, "An image file is required in the image field.");
  }

  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = env.r2;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new ApiError(503, "Cloudflare R2 is not configured.");
  }

  const path = `${folder}/${uid}/${Date.now()}-${randomUUID()}.${extensions[file.mimetype]}`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      CacheControl: "public,max-age=31536000,immutable",
    }),
  );

  const publicPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return {
    path,
    url: `${publicUrl}/${publicPath}`,
    contentType: file.mimetype,
    size: file.size,
    provider: "cloudflare-r2",
  };
}

export function savePostImage(file, uid) {
  return saveImage(file, uid, "posts");
}

export function saveProfileImage(file, uid) {
  return saveImage(file, uid, "profiles");
}

export function saveMessageImage(file, uid) {
  return saveImage(file, uid, "messages");
}

export async function deletePostImages(urls = []) {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = env.r2;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return;

  const prefix = `${publicUrl.replace(/\/$/, "")}/`;
  const keys = urls
    .filter((url) => typeof url === "string" && url.startsWith(prefix))
    .map((url) => decodeURIComponent(url.slice(prefix.length)));
  if (!keys.length) return;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}
