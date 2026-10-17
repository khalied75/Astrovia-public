import { FieldValue } from "firebase-admin/firestore";
import { db, requireAdminCredentials } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import { notifyUser } from "./notification.service.js";
import { serializeDocument } from "../utils/firestore.js";
import { deletePostImages } from "./upload.service.js";

const posts = db.collection("posts");
const users = db.collection("users");

async function authorFromProfile(user) {
  const profile = (await users.doc(user.uid).get()).data();
  return {
    displayName:
      profile?.displayName ||
      user.name ||
      user.email?.split("@")[0] ||
      "Astrovia Explorer",
    username: profile?.username || null,
    photoURL: profile?.photoURL || user.picture || null,
  };
}

async function addViewerState(documents, items, viewerId) {
  if (!viewerId || !documents.length) return items;
  const likeRefs = documents.map((document) =>
    document.ref.collection("likes").doc(viewerId),
  );
  const savedRefs = documents.map((document) =>
    users.doc(viewerId).collection("savedPosts").doc(document.id),
  );
  const states = await db.getAll(...likeRefs, ...savedRefs);
  items.forEach((item, index) => {
    item.likedByViewer = states[index].exists;
    item.savedByViewer = states[index + documents.length].exists;
  });
  return items;
}

export async function listPosts({ limit = 10, cursor, viewerId }) {
  requireAdminCredentials();
  let query = posts.orderBy("createdAt", "desc").limit(limit + 1);
  if (cursor) {
    const cursorSnapshot = await posts.doc(cursor).get();
    if (!cursorSnapshot.exists)
      throw new ApiError(400, "The feed cursor is invalid.");
    query = query.startAfter(cursorSnapshot);
  }
  const snapshot = await query.get();
  const pageDocuments = snapshot.docs.slice(0, limit);
  const items = pageDocuments.map(serializeDocument);
  await addViewerState(pageDocuments, items, viewerId);
  return {
    items,
    nextCursor:
      snapshot.size > limit ? pageDocuments.at(-1)?.id || null : null,
  };
}

export async function listQuestions({ questionType, viewerId, limit = 30 }) {
  requireAdminCredentials();
  const snapshot = await posts
    .where("topic", "==", "Question")
    .limit(100)
    .get();
  const paired = snapshot.docs
    .map((document) => ({ document, item: serializeDocument(document) }))
    .filter(({ item }) => !questionType || item.questionType === questionType)
    .sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt))
    .slice(0, limit);
  const documents = paired.map(({ document }) => document);
  const items = paired.map(({ item }) => item);
  await addViewerState(documents, items, viewerId);
  return items;
}

export async function getPost(id, viewerId) {
  requireAdminCredentials();
  const document = await posts.doc(id).get();
  const post = serializeDocument(document);
  if (!post) throw new ApiError(404, "Post not found.");
  await addViewerState([document], [post], viewerId);
  return post;
}

export async function createPost(input, user) {
  requireAdminCredentials();
  const ref = posts.doc();
  const author = await authorFromProfile(user);
  await ref.set({
    ...input,
    authorId: user.uid,
    author,
    likesCount: 0,
    commentsCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return serializeDocument(await ref.get());
}

async function ownedPost(id, uid) {
  const ref = posts.doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new ApiError(404, "Post not found.");
  if (snapshot.data().authorId !== uid)
    throw new ApiError(403, "You can only change your own posts.");
  return { ref, data: snapshot.data() };
}

export async function updatePost(id, uid, updates) {
  requireAdminCredentials();
  const { ref } = await ownedPost(id, uid);
  await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
  return serializeDocument(await ref.get());
}

export async function deletePost(id, uid) {
  requireAdminCredentials();
  const { ref, data } = await ownedPost(id, uid);
  const mediaUrls = data.mediaUrls || (data.mediaUrl ? [data.mediaUrl] : []);
  await deletePostImages(mediaUrls);
  await db.recursiveDelete(ref);
}

export async function listUserPosts(uid, viewerId, limit = 30) {
  requireAdminCredentials();
  const snapshot = await posts.where("authorId", "==", uid).limit(limit).get();
  const paired = snapshot.docs
    .map((document) => ({ document, item: serializeDocument(document) }))
    .sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
  const documents = paired.map(({ document }) => document);
  const items = paired.map(({ item }) => item);
  return addViewerState(documents, items, viewerId);
}

export function listOwnPosts(uid, limit = 30) {
  return listUserPosts(uid, uid, limit);
}

export async function listSavedPosts(uid, limit = 30) {
  requireAdminCredentials();
  const savedSnapshot = await users
    .doc(uid)
    .collection("savedPosts")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  if (savedSnapshot.empty) return [];

  const postSnapshots = await db.getAll(
    ...savedSnapshot.docs.map((saved) => posts.doc(saved.id)),
  );
  const existing = postSnapshots.filter((snapshot) => snapshot.exists);
  const items = existing.map(serializeDocument);
  await addViewerState(existing, items, uid);
  return items;
}

export async function toggleSave(postId, uid) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const savedRef = users.doc(uid).collection("savedPosts").doc(postId);
  return db.runTransaction(async (transaction) => {
    const [postSnapshot, savedSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(savedRef),
    ]);
    if (!postSnapshot.exists) throw new ApiError(404, "Post not found.");
    if (savedSnapshot.exists) {
      transaction.delete(savedRef);
      return { saved: false };
    }
    transaction.set(savedRef, {
      postId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { saved: true };
  });
}

export async function toggleLike(postId, uid) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const likeRef = postRef.collection("likes").doc(uid);
  return db.runTransaction(async (transaction) => {
    const [postSnapshot, likeSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(likeRef),
    ]);
    if (!postSnapshot.exists) throw new ApiError(404, "Post not found.");
    const currentCount = postSnapshot.data().likesCount || 0;
    if (likeSnapshot.exists) {
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likesCount: Math.max(0, currentCount - 1),
      });
      return { liked: false, likesCount: Math.max(0, currentCount - 1) };
    }
    transaction.set(likeRef, {
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(postRef, { likesCount: currentCount + 1 });
    return { liked: true, likesCount: currentCount + 1 };
  });
}

export async function listComments(postId, limit = 50) {
  requireAdminCredentials();
  await getPost(postId);
  const snapshot = await posts
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();
  return snapshot.docs.map(serializeDocument);
}

export async function addComment(postId, content, user) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const commentRef = postRef.collection("comments").doc();
  const author = await authorFromProfile(user);
  let recipientId = null;

  await db.runTransaction(async (transaction) => {
    const postSnapshot = await transaction.get(postRef);
    if (!postSnapshot.exists) throw new ApiError(404, "Post not found.");

    recipientId = postSnapshot.data().authorId;
    transaction.set(commentRef, {
      content,
      authorId: user.uid,
      author,
      repliesCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(postRef, { commentsCount: FieldValue.increment(1) });
  });

  const comment = serializeDocument(await commentRef.get());
  await notifyUser(recipientId, {
    type: "comment",
    senderId: user.uid,
    sender: author,
    preview: content.slice(0, 160),
    postId,
    commentId: commentRef.id,
    link: `/?post=${postId}#comments-${postId}`,
  });

  return comment;
}

export async function deleteComment(postId, commentId, uid) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const commentRef = postRef.collection("comments").doc(commentId);
  const [postSnapshot, commentSnapshot] = await Promise.all([
    postRef.get(),
    commentRef.get(),
  ]);
  if (!postSnapshot.exists || !commentSnapshot.exists) {
    throw new ApiError(404, "Comment not found.");
  }
  if (
    commentSnapshot.data().authorId !== uid &&
    postSnapshot.data().authorId !== uid
  ) {
    throw new ApiError(403, "You cannot delete this comment.");
  }
  await db.recursiveDelete(commentRef);
  await postRef.update({ commentsCount: FieldValue.increment(-1) });
}

export async function listReplies(postId, commentId, limit = 50) {
  requireAdminCredentials();
  const commentRef = posts.doc(postId).collection("comments").doc(commentId);
  const commentSnapshot = await commentRef.get();
  if (!commentSnapshot.exists) throw new ApiError(404, "Comment not found.");
  const snapshot = await commentRef
    .collection("replies")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();
  return snapshot.docs.map(serializeDocument);
}

export async function addReply(postId, commentId, content, user) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const commentRef = postRef.collection("comments").doc(commentId);
  const replyRef = commentRef.collection("replies").doc();
  const author = await authorFromProfile(user);
  let recipientId = null;
  await db.runTransaction(async (transaction) => {
    const [postSnapshot, commentSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(commentRef),
    ]);
    if (!postSnapshot.exists || !commentSnapshot.exists) {
      throw new ApiError(404, "Comment not found.");
    }
    recipientId = commentSnapshot.data().authorId;
    transaction.set(replyRef, {
      content,
      authorId: user.uid,
      author,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(commentRef, { repliesCount: FieldValue.increment(1) });
  });
  const reply = serializeDocument(await replyRef.get());
  await notifyUser(recipientId, {
    type: "reply",
    senderId: user.uid,
    sender: author,
    preview: content.slice(0, 160),
    postId,
    commentId,
    link: `/?post=${postId}#comments-${postId}`,
  });
  return reply;
}

export async function deleteReply(postId, commentId, replyId, uid) {
  requireAdminCredentials();
  const postRef = posts.doc(postId);
  const commentRef = postRef.collection("comments").doc(commentId);
  const replyRef = commentRef.collection("replies").doc(replyId);
  await db.runTransaction(async (transaction) => {
    const [postSnapshot, commentSnapshot, replySnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(commentRef),
      transaction.get(replyRef),
    ]);
    if (!postSnapshot.exists || !commentSnapshot.exists || !replySnapshot.exists) {
      throw new ApiError(404, "Reply not found.");
    }
    if (
      replySnapshot.data().authorId !== uid &&
      commentSnapshot.data().authorId !== uid &&
      postSnapshot.data().authorId !== uid
    ) {
      throw new ApiError(403, "You cannot delete this reply.");
    }
    transaction.delete(replyRef);
    transaction.update(commentRef, { repliesCount: FieldValue.increment(-1) });
  });
}
