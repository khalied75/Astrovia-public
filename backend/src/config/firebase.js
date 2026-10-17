import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabaseWithUrl } from "firebase-admin/database";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./env.js";

function normalizeServiceAccount(account, source) {
  const normalized = {
    projectId: account?.project_id || account?.projectId,
    clientEmail: account?.client_email || account?.clientEmail,
    privateKey: (account?.private_key || account?.privateKey)?.replace(
      /\\n/g,
      "\n",
    ),
  };
  if (
    !normalized.projectId ||
    !normalized.clientEmail ||
    !normalized.privateKey
  ) {
    console.warn(
      `${source} is empty or missing project_id, client_email, or private_key. Firebase data routes will remain disabled.`,
    );
    return null;
  }
  return normalized;
}

function readServiceAccount() {
  if (env.firebase.serviceAccountPath) {
    try {
      const raw = readFileSync(
        resolve(process.cwd(), env.firebase.serviceAccountPath),
        "utf8",
      );
      if (!raw.trim()) {
        console.warn(
          "FIREBASE_SERVICE_ACCOUNT_PATH points to an empty file. Firebase data routes will remain disabled.",
        );
        return null;
      }
      return normalizeServiceAccount(
        JSON.parse(raw),
        "FIREBASE_SERVICE_ACCOUNT_PATH",
      );
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn(
          "FIREBASE_SERVICE_ACCOUNT_PATH does not contain valid JSON. Firebase data routes will remain disabled.",
        );
      }
    }
  }

  if (env.firebase.serviceAccountJson) {
    try {
      const raw = env.firebase.serviceAccountJson.trim();
      const decoded = raw.startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");
      return normalizeServiceAccount(
        JSON.parse(decoded),
        "FIREBASE_SERVICE_ACCOUNT_JSON",
      );
    } catch {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_JSON is invalid. Firebase data routes will remain disabled.",
      );
      return null;
    }
  }

  if (
    env.firebase.projectId &&
    env.firebase.clientEmail &&
    env.firebase.privateKey
  ) {
    return {
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    };
  }

  return null;
}

const serviceAccount = readServiceAccount();
export const hasAdminCredentials = Boolean(
  serviceAccount ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.FIRESTORE_EMULATOR_HOST,
);

export function requireAdminCredentials() {
  if (hasAdminCredentials) return;
  const error = new Error(
    "Firebase Admin credentials are not configured. Replace backend/serviceAccountKey.json with the JSON key downloaded from Firebase Console.",
  );
  error.status = 503;
  throw error;
}

const firebaseApp =
  getApps()[0] ||
  initializeApp({
    ...(serviceAccount
      ? { credential: cert(serviceAccount) }
      : process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? { credential: applicationDefault() }
        : {}),
    ...(env.firebase.projectId && { projectId: env.firebase.projectId }),
  });

const databaseUrl =
  env.firebase.databaseUrl ||
  (env.firebase.projectId
    ? `https://${env.firebase.projectId}-default-rtdb.firebaseio.com`
    : "");

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
db.settings({ ignoreUndefinedProperties: true });
export const realtimeDb = databaseUrl
  ? getDatabaseWithUrl(databaseUrl, firebaseApp)
  : null;
