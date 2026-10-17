import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import {
  deleteAllNotifications,
  deleteNotification,
  listenToNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notifications";
import UserAvatar from "../UserAvatar";

function notificationTitle(notification) {
  const name = notification.sender?.displayName || "An observer";
  if (notification.type === "follow") return `${name} followed you`;
  if (notification.type === "comment") return `${name} commented on your post`;
  if (notification.type === "reply") return `${name} replied to your comment`;
  return `${name} sent you a message`;
}

function timeLabel(timestamp) {
  if (!timestamp) return "NOW";
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "NOW";
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H`;
  return `${Math.floor(hours / 24)}D`;
}

export default function NotificationCenter({ onNavigate }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const centerRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!user) return undefined;
    return listenToNotifications(
      user.uid,
      setNotifications,
      (databaseError) => setError(databaseError.message),
    );
  }, [user]);

  useEffect(() => {
    function closeOutside(event) {
      if (!centerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  async function readNotification(notification) {
    setOpen(false);
    onNavigate?.();
    if (notification.read) return;
    try {
      await markNotificationRead(user.uid, notification.id);
    } catch (readError) {
      setError(readError.message);
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead(user.uid, notifications);
    } catch (readError) {
      setError(readError.message);
    }
  }

  async function removeNotification(notificationId) {
    try {
      setError("");
      await deleteNotification(user.uid, notificationId);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function removeAll() {
    try {
      setError("");
      await deleteAllNotifications(user.uid);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="relative max-[760px]:my-2" ref={centerRef}>
      <button
        type="button"
        className={`relative grid size-10 shrink-0 place-items-center border transition max-[760px]:w-full ${open ? "border-white text-white" : "border-neutral-700 text-neutral-400 hover:border-neutral-400 hover:text-white"}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 grid min-h-4 min-w-4 place-items-center border border-white bg-white px-1 font-mono text-[7px] text-black max-[760px]:top-1 max-[760px]:right-2">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute top-12 right-0 z-50 w-[min(390px,calc(100vw_-_40px))] border border-neutral-600 bg-neutral-950 shadow-[7px_7px_0_#262626] max-[760px]:top-full max-[760px]:right-0 max-[760px]:left-0 max-[760px]:w-full">
          <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <div>
              <p className="font-mono text-[8px] tracking-[1px] text-neutral-500">
                INCOMING SIGNALS
              </p>
              <h2 className="mt-1 text-lg">Notifications.</h2>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="font-mono text-[8px] text-neutral-400 uppercase hover:text-white"
                  onClick={readAll}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="border border-neutral-700 px-2 py-1 font-mono text-[8px] text-neutral-300 uppercase hover:border-white hover:text-white"
                  onClick={removeAll}
                >
                  Delete all
                </button>
              )}
            </div>
          </header>

          <div className="max-h-[430px] overflow-y-auto">
            {error && (
              <p className="border-b border-red-950 px-4 py-3 text-xs text-red-300">
                {error}
              </p>
            )}
            {!notifications.length && !error && (
              <p className="px-5 py-10 text-center text-xs leading-6 text-neutral-500">
                No incoming signals yet.
              </p>
            )}
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex border-b border-neutral-800 transition hover:bg-neutral-900 ${notification.read ? "opacity-60" : "bg-neutral-900/50"}`}
              >
                <Link
                  className="flex min-w-0 flex-1 gap-3 p-4"
                  to={notification.link || "/"}
                  onClick={() => readNotification(notification)}
                >
                  <UserAvatar
                    person={notification.sender}
                    className="size-10 font-mono text-[9px]"
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs font-medium">
                      {notificationTitle(notification)}
                    </strong>
                    {notification.preview && (
                      <small className="mt-1 block truncate text-[11px] text-neutral-500">
                        {notification.preview}
                      </small>
                    )}
                  </span>
                  <span className="font-mono text-[7px] text-neutral-600">
                    {timeLabel(notification.createdAt)}
                  </span>
                </Link>
                <button
                  type="button"
                  className="m-3 grid size-7 shrink-0 place-items-center self-center border border-neutral-700 font-mono text-xs text-neutral-500 hover:border-red-500 hover:text-red-300"
                  onClick={() => removeNotification(notification.id)}
                  aria-label={`Delete notification: ${notificationTitle(notification)}`}
                  title="Delete notification"
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
