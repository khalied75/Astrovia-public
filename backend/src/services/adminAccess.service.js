import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db, requireAdminCredentials } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";

const scrypt = promisify(scryptCallback);
const credentials = db.collection("adminSecurity");
const sessions = db.collection("adminAccessSessions");
const SESSION_DURATION_MS = 30 * 60 * 1000;

function passwordValue(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128) {
    throw new ApiError(
      400,
      "The admin security password must be between 10 and 128 characters.",
    );
  }
  return value;
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function derivePassword(password, salt) {
  return Buffer.from(await scrypt(password, salt, 64));
}

async function createSession(adminId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Timestamp.fromMillis(Date.now() + SESSION_DURATION_MS);
  await sessions.doc(tokenHash(token)).set({
    adminId,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { token, expiresAt: expiresAt.toDate().toISOString() };
}

export async function adminPasswordStatus(adminId) {
  requireAdminCredentials();
  return { configured: (await credentials.doc(adminId).get()).exists };
}

export async function createAdminPassword(adminId, rawPassword) {
  requireAdminCredentials();
  const password = passwordValue(rawPassword);
  const credentialRef = credentials.doc(adminId);
  const salt = randomBytes(16);
  const passwordHash = await derivePassword(password, salt);

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(credentialRef);
    if (current.exists) {
      throw new ApiError(409, "The admin security password is already set.");
    }
    transaction.set(credentialRef, {
      algorithm: "scrypt",
      salt: salt.toString("base64"),
      passwordHash: passwordHash.toString("base64"),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return createSession(adminId);
}

export async function unlockAdminAccess(adminId, rawPassword) {
  requireAdminCredentials();
  const password = passwordValue(rawPassword);
  const snapshot = await credentials.doc(adminId).get();
  if (!snapshot.exists) {
    throw new ApiError(409, "Create the admin security password first.");
  }

  const stored = snapshot.data();
  const expected = Buffer.from(stored.passwordHash || "", "base64");
  const actual = await derivePassword(
    password,
    Buffer.from(stored.salt || "", "base64"),
  );
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ApiError(401, "The admin security password is incorrect.");
  }

  return createSession(adminId);
}

export async function validateAdminSession(adminId, token) {
  requireAdminCredentials();
  if (typeof token !== "string" || token.length < 20) return false;
  const ref = sessions.doc(tokenHash(token));
  const snapshot = await ref.get();
  if (!snapshot.exists) return false;
  const session = snapshot.data();
  if (
    session.adminId !== adminId ||
    !session.expiresAt ||
    session.expiresAt.toMillis() <= Date.now()
  ) {
    await ref.delete().catch(() => {});
    return false;
  }
  return true;
}

export async function deleteAdminSession(adminId, token) {
  if (typeof token !== "string" || token.length < 20) return;
  const ref = sessions.doc(tokenHash(token));
  const snapshot = await ref.get();
  if (snapshot.exists && snapshot.data().adminId === adminId) {
    await ref.delete();
  }
}
