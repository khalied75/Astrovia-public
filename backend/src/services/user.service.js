import { FieldValue } from "firebase-admin/firestore";
import { db, requireAdminCredentials } from "../config/firebase.js";
import { serializeDocument } from "../utils/firestore.js";
import ApiError from "../utils/ApiError.js";
import { notifyUser } from "./notification.service.js";

const users = db.collection("users");
const usernames = db.collection("usernames");
const posts = db.collection("posts");

async function syncPostAuthor(uid, profile) {
  const snapshot = await posts.where("authorId", "==", uid).get();
  const author = {
    displayName: profile.displayName || "Astrovia Explorer",
    username: profile.username || null,
    photoURL: profile.photoURL || null,
  };

  for (let start = 0; start < snapshot.docs.length; start += 450) {
    const batch = db.batch();
    snapshot.docs.slice(start, start + 450).forEach((document) => {
      batch.update(document.ref, { author });
    });
    await batch.commit();
  }
}

export async function upsertUserFromToken(token) {
  requireAdminCredentials();
  const ref = users.doc(token.uid);
  const snapshot = await ref.get();
  const identity = {
    email: token.email || null,
    displayName:
      token.name || token.email?.split("@")[0] || "Astrovia Explorer",
    photoURL: token.picture || null,
  };

  if (!snapshot.exists) {
    await ref.set({
      ...identity,
      username: null,
      bio: "",
      location: "",
      website: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set(
      { email: identity.email, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  return serializeDocument(await ref.get());
}

export async function getUser(uid) {
  requireAdminCredentials();
  return serializeDocument(await users.doc(uid).get());
}

export async function getPublicUser(uid, viewerId) {
  requireAdminCredentials();
  const userRef = users.doc(uid);
  const [userSnapshot, followingSnapshot] = await Promise.all([
    userRef.get(),
    viewerId && viewerId !== uid
      ? userRef.collection("followers").doc(viewerId).get()
      : Promise.resolve(null),
  ]);
  const user = serializeDocument(userSnapshot);
  if (!user) return null;
  return {
    ...user,
    followerCount: Math.max(0, user.followerCount || 0),
    followingCount: Math.max(0, user.followingCount || 0),
    followedByViewer: Boolean(followingSnapshot?.exists),
  };
}

export async function toggleFollow(viewerId, targetId) {
  requireAdminCredentials();
  if (viewerId === targetId) {
    throw new ApiError(400, "You cannot follow your own account.");
  }

  const viewerRef = users.doc(viewerId);
  const targetRef = users.doc(targetId);
  const followerRef = targetRef.collection("followers").doc(viewerId);
  const followingRef = viewerRef.collection("following").doc(targetId);

  const result = await db.runTransaction(async (transaction) => {
    const [viewerSnapshot, targetSnapshot, followerSnapshot] =
      await Promise.all([
        transaction.get(viewerRef),
        transaction.get(targetRef),
        transaction.get(followerRef),
      ]);

    if (!viewerSnapshot.exists) throw new ApiError(404, "Your profile was not found.");
    if (!targetSnapshot.exists) throw new ApiError(404, "This observer was not found.");

    const followed = !followerSnapshot.exists;
    const followerCount = Math.max(
      0,
      (targetSnapshot.data()?.followerCount || 0) + (followed ? 1 : -1),
    );
    const followingCount = Math.max(
      0,
      (viewerSnapshot.data()?.followingCount || 0) + (followed ? 1 : -1),
    );

    if (followed) {
      const relationship = { createdAt: FieldValue.serverTimestamp() };
      transaction.set(followerRef, relationship);
      transaction.set(followingRef, relationship);
    } else {
      transaction.delete(followerRef);
      transaction.delete(followingRef);
    }

    transaction.set(
      targetRef,
      { followerCount, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    transaction.set(
      viewerRef,
      { followingCount, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    const viewer = viewerSnapshot.data();
    return {
      followed,
      followerCount,
      sender: {
        displayName: viewer.displayName || "Astrovia Explorer",
        username: viewer.username || "",
        photoURL: viewer.photoURL || "",
      },
    };
  });

  if (result.followed) {
    await notifyUser(targetId, {
      type: "follow",
      senderId: viewerId,
      sender: result.sender,
      preview: "started following you.",
      link: `/profile/${viewerId}`,
    });
  }

  return {
    followed: result.followed,
    followerCount: result.followerCount,
  };
}

export async function listConnections(uid, relationship, limit = 50) {
  requireAdminCredentials();
  if (relationship !== "followers" && relationship !== "following") {
    throw new ApiError(400, "The relationship type is invalid.");
  }

  const ownerRef = users.doc(uid);
  const ownerSnapshot = await ownerRef.get();
  if (!ownerSnapshot.exists) throw new ApiError(404, "This observer was not found.");

  const relationships = await ownerRef
    .collection(relationship)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  if (relationships.empty) return [];

  const profileSnapshots = await db.getAll(
    ...relationships.docs.map((document) => users.doc(document.id)),
  );
  return profileSnapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => {
      const profile = serializeDocument(snapshot);
      return {
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username || null,
        photoURL: profile.photoURL || null,
        bio: profile.bio || "",
      };
    });
}

export async function updateUser(uid, updates) {
  requireAdminCredentials();
  const ref = users.doc(uid);
  if (updates.username === undefined) {
    await ref.set(
      { ...updates, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    const profile = serializeDocument(await ref.get());
    await syncPostAuthor(uid, profile);
    return profile;
  }

  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(ref);
    const oldUsername = userSnapshot.data()?.username || null;
    const usernameRef = usernames.doc(updates.username);
    const usernameSnapshot = await transaction.get(usernameRef);

    if (usernameSnapshot.exists && usernameSnapshot.data().uid !== uid) {
      throw new ApiError(409, "This username is already taken.");
    }

    transaction.set(
      ref,
      { ...updates, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    transaction.set(usernameRef, {
      uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (oldUsername && oldUsername !== updates.username) {
      transaction.delete(usernames.doc(oldUsername));
    }
  });
  const profile = serializeDocument(await ref.get());
  await syncPostAuthor(uid, profile);
  return profile;
}
