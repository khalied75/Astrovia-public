import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { listenToConversations } from "../../services/messages";

export default function MessagesNavLink({ onNavigate }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    return listenToConversations(
      user.uid,
      (conversations) => {
        const total = conversations.reduce(
          (count, conversation) => count + (conversation.unreadCount || 0),
          0,
        );
        setUnreadCount(total);
      },
      () => setUnreadCount(0),
    );
  }, [user]);

  const visibleUnreadCount = user ? unreadCount : 0;

  return (
    <NavLink
      to="/messages"
      onClick={onNavigate}
      aria-label={`Messages${visibleUnreadCount ? `, ${visibleUnreadCount} unread` : ""}`}
      className={({ isActive }) =>
        `${isActive ? "text-white after:absolute after:right-0 after:bottom-4 after:left-0 after:h-px after:bg-neutral-200 max-[760px]:after:right-auto max-[760px]:after:bottom-1.5 max-[760px]:after:w-7" : "text-neutral-400"} relative flex h-full items-center whitespace-nowrap font-mono text-[10px] font-bold uppercase transition-colors hover:text-white max-[760px]:py-4`
      }
    >
      Messages
      {visibleUnreadCount > 0 && (
        <span className="absolute -right-3 top-1 grid min-h-4 min-w-4 place-items-center border border-white bg-white px-1 font-mono text-[7px] text-black max-[760px]:right-1 max-[760px]:top-2">
          {visibleUnreadCount > 99 ? "99+" : visibleUnreadCount}
        </span>
      )}
    </NavLink>
  );
}
