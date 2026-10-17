import { useState } from "react";

export default function MessageBubble({ message, mine, onDelete }) {
  const [imageOpen, setImageOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeMessage() {
    if (!window.confirm("Delete this message permanently?")) return;
    setDeleting(true);
    try {
      await onDelete(message.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] border p-2 text-sm leading-6 ${mine ? "border-white bg-white text-black" : "border-neutral-700 bg-neutral-900 text-neutral-200"}`}
        >
          {message.imageUrl && (
            <button
              type="button"
              className="block overflow-hidden bg-black"
              onClick={() => setImageOpen(true)}
              aria-label="Open message image"
            >
              <img
                className="max-h-80 max-w-full object-contain sm:max-w-md"
                src={message.imageUrl}
                alt="Shared in conversation"
                loading="lazy"
              />
            </button>
          )}
          {message.text && (
            <p className="whitespace-pre-wrap px-2 pt-2 [overflow-wrap:anywhere]">
              {message.text}
            </p>
          )}
          <span className="mt-2 flex items-center justify-between gap-3 px-2 font-mono text-[8px] text-neutral-600">
            <span>
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "SENDING"}
            </span>
            {mine && (
              <button
                type="button"
                className="inline-flex min-h-7 items-center gap-1.5 border border-black/40 bg-neutral-100 px-2 font-mono text-[8px] font-bold text-black uppercase transition hover:border-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                onClick={removeMessage}
                disabled={deleting}
                aria-label="Delete this message"
              >
                {!deleting && (
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 10v7m4-7v7" />
                  </svg>
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </span>
        </div>
      </div>

      {imageOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Message image preview"
          onClick={() => setImageOpen(false)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 border border-white px-4 py-2 font-mono text-xs text-white"
            onClick={() => setImageOpen(false)}
          >
            CLOSE ×
          </button>
          <img
            className="max-h-[90vh] max-w-[95vw] object-contain"
            src={message.imageUrl}
            alt="Shared in conversation"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
