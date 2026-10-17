import {
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  remove,
  update,
} from "firebase/database";
import { realtimeDb } from "../config/realtime";

export function listenToNotifications(uid, onChange, onError) {
  const notificationsQuery = query(
    ref(realtimeDb, `notifications/${uid}`),
    orderByChild("createdAt"),
    limitToLast(30),
  );
  return onValue(
    notificationsQuery,
    (snapshot) => {
      const notifications = Object.entries(snapshot.val() || {})
        .map(([id, value]) => ({ id, ...value }))
        .sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
      onChange(notifications);
    },
    onError,
  );
}

export function markNotificationRead(uid, notificationId) {
  return update(ref(realtimeDb, `notifications/${uid}/${notificationId}`), {
    read: true,
  });
}

export function markAllNotificationsRead(uid, notifications) {
  const updates = Object.fromEntries(
    notifications
      .filter((notification) => !notification.read)
      .map((notification) => [
        `notifications/${uid}/${notification.id}/read`,
        true,
      ]),
  );
  if (!Object.keys(updates).length) return Promise.resolve();
  return update(ref(realtimeDb), updates);
}

export function deleteNotification(uid, notificationId) {
  return remove(ref(realtimeDb, `notifications/${uid}/${notificationId}`));
}

export function deleteAllNotifications(uid) {
  return remove(ref(realtimeDb, `notifications/${uid}`));
}
