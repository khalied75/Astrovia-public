import {
  get,
  increment,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { realtimeDb } from "../config/realtime";

export function conversationIdFor(firstUid, secondUid) {
  return [firstUid, secondUid].sort().join("--");
}

function summary(user, profile) {
  return {
    uid: user.uid,
    displayName:
      profile?.displayName || user.displayName || user.email?.split("@")[0] || "Astrovia Observer",
    username: profile?.username || "",
    photoURL: profile?.photoURL || user.photoURL || "",
  };
}

export async function ensureConversation(currentUser, currentProfile, otherProfile) {
  const [participantA, participantB] = [currentUser.uid, otherProfile.id].sort();
  const conversationId = conversationIdFor(participantA, participantB);
  const conversationRef = ref(realtimeDb, `conversations/${conversationId}`);
  const currentSummary = summary(currentUser, currentProfile);
  const otherSummary = {
    uid: otherProfile.id,
    displayName: otherProfile.displayName || "Astrovia Observer",
    username: otherProfile.username || "",
    photoURL: otherProfile.photoURL || "",
  };
  const snapshot = await get(conversationRef);

  if (!snapshot.exists()) {
    await set(conversationRef, {
      participants: {
        [currentUser.uid]: true,
        [otherProfile.id]: true,
      },
      participantA,
      participantB,
      profiles: {
        [currentUser.uid]: currentSummary,
        [otherProfile.id]: otherSummary,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      lastSenderId: "",
    });
  } else {
    await update(conversationRef, {
      [`profiles/${currentUser.uid}`]: currentSummary,
      [`profiles/${otherProfile.id}`]: otherSummary,
      updatedAt: serverTimestamp(),
    });
  }

  await update(ref(realtimeDb, `userConversations/${currentUser.uid}/${conversationId}`), {
    otherUserId: otherProfile.id,
    otherUser: otherSummary,
    updatedAt: serverTimestamp(),
    lastMessage: snapshot.val()?.lastMessage || "",
    unreadCount: 0,
  });
  await update(ref(realtimeDb, `userConversations/${otherProfile.id}/${conversationId}`), {
    otherUserId: currentUser.uid,
    otherUser: currentSummary,
    updatedAt: serverTimestamp(),
    lastMessage: snapshot.val()?.lastMessage || "",
  });

  return conversationId;
}

export function listenToConversations(uid, onChange, onError) {
  const conversationsQuery = query(
    ref(realtimeDb, `userConversations/${uid}`),
    orderByChild("updatedAt"),
  );
  return onValue(
    conversationsQuery,
    (snapshot) => {
      const items = Object.entries(snapshot.val() || {})
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onChange(items);
    },
    onError,
  );
}

export function listenToMessages(conversationId, onChange, onError) {
  const messagesQuery = query(
    ref(realtimeDb, `messages/${conversationId}`),
    orderByChild("createdAt"),
    limitToLast(100),
  );
  return onValue(
    messagesQuery,
    (snapshot) => {
      const items = Object.entries(snapshot.val() || {}).map(([id, value]) => ({
        id,
        ...value,
      }));
      onChange(items);
    },
    onError,
  );
}

export function markConversationRead(uid, conversationId) {
  return update(
    ref(realtimeDb, `userConversations/${uid}/${conversationId}`),
    { unreadCount: 0 },
  );
}

export function hideConversation(uid, conversationId) {
  return remove(
    ref(realtimeDb, `userConversations/${uid}/${conversationId}`),
  );
}

export async function sendMessage({
  currentUser,
  currentProfile,
  otherProfile,
  text,
  imageUrl = "",
}) {
  const conversationId = await ensureConversation(
    currentUser,
    currentProfile,
    otherProfile,
  );
  const messageRef = push(ref(realtimeDb, `messages/${conversationId}`));
  const cleanText = text.trim();
  const messageSummary = cleanText || "Sent an image";

  const currentSummary = summary(currentUser, currentProfile);
  const otherSummary = {
    uid: otherProfile.id,
    displayName: otherProfile.displayName || "Astrovia Observer",
    username: otherProfile.username || "",
    photoURL: otherProfile.photoURL || "",
  };
  const notificationRef = push(
    ref(realtimeDb, `notifications/${otherProfile.id}`),
  );
  await update(ref(realtimeDb), {
    [`messages/${conversationId}/${messageRef.key}`]: {
      senderId: currentUser.uid,
      text: cleanText,
      ...(imageUrl && { imageUrl }),
      createdAt: serverTimestamp(),
    },
    [`conversations/${conversationId}/lastMessage`]: messageSummary,
    [`conversations/${conversationId}/lastSenderId`]: currentUser.uid,
    [`conversations/${conversationId}/updatedAt`]: serverTimestamp(),
    [`userConversations/${currentUser.uid}/${conversationId}`]: {
      otherUserId: otherProfile.id,
      otherUser: otherSummary,
      lastMessage: messageSummary,
      updatedAt: serverTimestamp(),
      unreadCount: 0,
    },
    [`userConversations/${otherProfile.id}/${conversationId}`]: {
      otherUserId: currentUser.uid,
      otherUser: currentSummary,
      lastMessage: messageSummary,
      updatedAt: serverTimestamp(),
      unreadCount: increment(1),
    },
    [`notifications/${otherProfile.id}/${notificationRef.key}`]: {
      type: "message",
      recipientId: otherProfile.id,
      senderId: currentUser.uid,
      sender: currentSummary,
      conversationId,
      preview: messageSummary.slice(0, 160),
      link: `/messages/${currentUser.uid}`,
      read: false,
      createdAt: serverTimestamp(),
    },
  });
}
