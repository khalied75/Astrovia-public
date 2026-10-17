function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: numberFromEnv(process.env.PORT, 5000),
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean),
  firebase: {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
  },
  r2: {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, ""),
  },
});

export const isProduction = env.nodeEnv === "production";
