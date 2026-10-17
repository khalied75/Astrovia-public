import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";

export default function ConversationList({
  contacts,
  activeUserId,
  deletingId,
  onDelete,
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-800 max-[760px]:border-r-0 max-[760px]:border-b">
      <div className="border-b border-neutral-800 px-4 py-4 font-mono text-[9px] tracking-[1px] text-neutral-500">
        PEOPLE / {contacts.length}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto max-[760px]:flex max-[760px]:max-h-32">
        {contacts.map((contact) => (
          <article
            className={`flex border-b border-neutral-800 transition hover:bg-neutral-900 max-[760px]:min-w-72 max-[760px]:border-r ${contact.otherUserId === activeUserId ? "bg-neutral-900" : ""}`}
            key={contact.id}
          >
            <Link
              className="flex min-w-0 flex-1 gap-3 p-4"
              to={`/messages/${contact.otherUserId}`}
            >
              <UserAvatar
                person={contact.otherUser}
                className="size-11 font-mono text-xs"
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-medium">
                  {contact.otherUser?.displayName || "Observer"}
                </strong>
                <small className="mt-1 block truncate text-xs text-neutral-500">
                  {contact.lastMessage || "New private channel"}
                </small>
              </span>
              {contact.unreadCount > 0 && (
                <span className="grid size-5 shrink-0 place-items-center self-center bg-white font-mono text-[8px] text-black">
                  {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="m-3 grid size-8 shrink-0 place-items-center self-center border border-neutral-700 text-neutral-500 transition hover:border-red-700 hover:text-red-300 disabled:opacity-40"
              onClick={() => onDelete(contact)}
              disabled={deletingId === contact.id}
              aria-label={`Remove conversation with ${contact.otherUser?.displayName || "observer"}`}
              title="Remove conversation from my list"
            >
              {deletingId === contact.id ? (
                <span className="font-mono text-[7px]">...</span>
              ) : (
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 10v7m4-7v7" />
                </svg>
              )}
            </button>
          </article>
        ))}
        {!contacts.length && (
          <p className="p-5 text-xs leading-6 text-neutral-500">
            Open a public profile and select Message to begin.
          </p>
        )}
      </div>
    </aside>
  );
}
