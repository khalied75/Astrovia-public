import { FieldValue } from "firebase-admin/firestore";
import { db, requireAdminCredentials } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import { serializeDocument } from "../utils/firestore.js";
import { deleteComment, deletePost, deleteReply } from "./post.service.js";

const reports = db.collection("reports");
const posts = db.collection("posts");
const users = db.collection("users");
const adminLogs = db.collection("adminLogs");

async function reporterSnapshot(user) {
  const profile = (await users.doc(user.uid).get()).data();
  return {
    displayName:
      profile?.displayName ||
      user.name ||
      user.email?.split("@")[0] ||
      "Astrovia Observer",
    username: profile?.username || null,
    photoURL: profile?.photoURL || user.picture || null,
  };
}

export async function reportPost(postId, { reason, details }, user) {
  requireAdminCredentials();
  const reportRef = reports.doc(`${postId}_${user.uid}`);
  const postRef = posts.doc(postId);
  const profileRef = users.doc(user.uid);

  await db.runTransaction(async (transaction) => {
    const [postSnapshot, reportSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(reportRef),
      transaction.get(profileRef),
    ]);
    if (!postSnapshot.exists) throw new ApiError(404, "Post not found.");
    if (postSnapshot.data().authorId === user.uid) {
      throw new ApiError(400, "You cannot report your own post.");
    }
    if (reportSnapshot.exists) {
      throw new ApiError(409, "You already reported this post.");
    }

    const post = postSnapshot.data();
    const profile = profileSnapshot.data();
    transaction.set(reportRef, {
      targetType: "post",
      targetId: postId,
      targetAuthorId: post.authorId,
      postId,
      postAuthorId: post.authorId,
      reporterId: user.uid,
      reporter: {
        displayName:
          profile?.displayName ||
          user.name ||
          user.email?.split("@")[0] ||
          "Astrovia Observer",
        username: profile?.username || null,
        photoURL: profile?.photoURL || user.picture || null,
      },
      reason,
      details: details || "",
      status: "pending",
      postSnapshot: {
        content: post.content || "",
        topic: post.topic || "General",
        mediaUrls: post.mediaUrls || (post.mediaUrl ? [post.mediaUrl] : []),
        author: post.author || null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return serializeDocument(await reportRef.get());
}

export async function reportComment(
  postId,
  commentId,
  replyId,
  { reason, details },
  user,
) {
  requireAdminCredentials();
  const targetType = replyId ? "reply" : "comment";
  const targetId = replyId || commentId;
  const reportRef = reports.doc(
    `${postId}_${targetType}_${commentId}_${replyId ? `${replyId}_` : ""}${user.uid}`,
  );
  const postRef = posts.doc(postId);
  const commentRef = postRef.collection("comments").doc(commentId);
  const targetRef = replyId
    ? commentRef.collection("replies").doc(replyId)
    : commentRef;
  const reporter = await reporterSnapshot(user);

  await db.runTransaction(async (transaction) => {
    const [postSnapshot, commentSnapshot, targetSnapshot, reportSnapshot] =
      await Promise.all([
        transaction.get(postRef),
        transaction.get(commentRef),
        transaction.get(targetRef),
        transaction.get(reportRef),
      ]);
    if (!postSnapshot.exists) throw new ApiError(404, "Post not found.");
    if (!commentSnapshot.exists || !targetSnapshot.exists) {
      throw new ApiError(404, `${replyId ? "Reply" : "Comment"} not found.`);
    }
    if (targetSnapshot.data().authorId === user.uid) {
      throw new ApiError(400, `You cannot report your own ${targetType}.`);
    }
    if (reportSnapshot.exists) {
      throw new ApiError(409, `You already reported this ${targetType}.`);
    }

    const post = postSnapshot.data();
    const target = targetSnapshot.data();
    transaction.set(reportRef, {
      targetType,
      targetId,
      targetAuthorId: target.authorId,
      postId,
      postAuthorId: post.authorId,
      commentId,
      ...(replyId && { replyId }),
      reporterId: user.uid,
      reporter,
      reason,
      details: details || "",
      status: "pending",
      contentSnapshot: {
        content: target.content || "",
        author: target.author || null,
      },
      postSnapshot: {
        content: post.content || "",
        topic: post.topic || "General",
        author: post.author || null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return serializeDocument(await reportRef.get());
}

export async function listReports({ status, limit = 50 }) {
  requireAdminCredentials();
  let query = reports.limit(Math.min(limit, 100));
  if (status && status !== "all") query = query.where("status", "==", status);
  const snapshot = await query.get();
  return snapshot.docs
    .map(serializeDocument)
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
}

export async function updateReportStatus(reportId, status, admin) {
  requireAdminCredentials();
  const reportRef = reports.doc(reportId);
  const logRef = adminLogs.doc();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reportRef);
    if (!snapshot.exists) throw new ApiError(404, "Report not found.");
    transaction.update(reportRef, {
      status,
      reviewedBy: admin.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(logRef, {
      adminId: admin.uid,
      action: `report_${status}`,
      reportId,
      postId: snapshot.data().postId,
      targetType: snapshot.data().targetType || "post",
      targetId: snapshot.data().targetId || snapshot.data().postId,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return serializeDocument(await reportRef.get());
}

export async function deleteReportedContent(reportId, admin) {
  requireAdminCredentials();
  const reportRef = reports.doc(reportId);
  const snapshot = await reportRef.get();
  if (!snapshot.exists) throw new ApiError(404, "Report not found.");
  const report = snapshot.data();
  const reportsForPost = await reports.where("postId", "==", report.postId).get();

  try {
    if (report.targetType === "comment") {
      await deleteComment(report.postId, report.commentId, report.postAuthorId);
    } else if (report.targetType === "reply") {
      await deleteReply(
        report.postId,
        report.commentId,
        report.replyId,
        report.postAuthorId,
      );
    } else {
      await deletePost(report.postId, report.postAuthorId);
    }
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const logRef = adminLogs.doc();
  const batch = db.batch();
  const affectedReports = reportsForPost.docs.filter((document) => {
    const item = document.data();
    if (report.targetType === "post") return true;
    if (report.targetType === "comment") {
      return item.commentId === report.commentId;
    }
    return item.targetType === "reply" && item.replyId === report.replyId;
  });
  affectedReports.forEach((document) => {
    batch.update(document.ref, {
      status: "content_deleted",
      reviewedBy: admin.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  batch.set(logRef, {
    adminId: admin.uid,
    action: `reported_${report.targetType || "post"}_deleted`,
    reportId,
    postId: report.postId,
    postAuthorId: report.postAuthorId,
    targetType: report.targetType || "post",
    targetId: report.targetId || report.postId,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return serializeDocument(await reportRef.get());
}
