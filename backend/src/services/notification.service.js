import { realtimeDb } from "../config/firebase.js";

export async function notifyUser(recipientId, notification) {
  if (!realtimeDb || !recipientId || recipientId === notification.senderId) {
    return;
  }

  try {
    const notificationRef = realtimeDb.ref(`notifications/${recipientId}`).push();
    await notificationRef.set({
      ...notification,
      recipientId,
      read: false,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.warn(`[notification] ${error.code || "write-failed"}: ${error.message}`);
  }
}
