import { realtimeDb, requireAdminCredentials } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import { deletePostImages } from "./upload.service.js";

export async function deleteMessage(conversationId, messageId, uid) {
  requireAdminCredentials();
  if (!realtimeDb) throw new ApiError(503, "Realtime Database is not configured.");

  const conversationRef = realtimeDb.ref(`conversations/${conversationId}`);
  const messageRef = realtimeDb.ref(`messages/${conversationId}/${messageId}`);
  const [conversationSnapshot, messageSnapshot] = await Promise.all([
    conversationRef.get(),
    messageRef.get(),
  ]);
  if (!conversationSnapshot.exists()) {
    throw new ApiError(404, "Conversation not found.");
  }

  const conversation = conversationSnapshot.val();
  if (![conversation.participantA, conversation.participantB].includes(uid)) {
    throw new ApiError(403, "You do not have access to this conversation.");
  }
  if (!messageSnapshot.exists()) throw new ApiError(404, "Message not found.");

  const message = messageSnapshot.val();
  if (message.senderId !== uid) {
    throw new ApiError(403, "You can only delete your own messages.");
  }

  if (message.imageUrl) await deletePostImages([message.imageUrl]);
  await messageRef.remove();

  const remainingSnapshot = await realtimeDb
    .ref(`messages/${conversationId}`)
    .orderByChild("createdAt")
    .limitToLast(1)
    .get();
  const latestMessage = Object.values(remainingSnapshot.val() || {})[0];
  const lastMessage = latestMessage
    ? latestMessage.text || "Sent an image"
    : "";
  const updatedAt =
    latestMessage?.createdAt || conversation.createdAt || Date.now();
  const updates = {
    [`conversations/${conversationId}/lastMessage`]: lastMessage,
    [`conversations/${conversationId}/lastSenderId`]:
      latestMessage?.senderId || "",
    [`conversations/${conversationId}/updatedAt`]: updatedAt,
  };
  for (const participantId of [
    conversation.participantA,
    conversation.participantB,
  ]) {
    updates[
      `userConversations/${participantId}/${conversationId}/lastMessage`
    ] = lastMessage;
    updates[
      `userConversations/${participantId}/${conversationId}/updatedAt`
    ] = updatedAt;
  }
  await realtimeDb.ref().update(updates);
}
