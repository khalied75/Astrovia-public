import { useEffect } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";

export default function ConnectionsDialog({
  title,
  connections,
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[75vh] w-full max-w-lg overflow-hidden border border-neutral-600 bg-neutral-950 shadow-[8px_8px_0_#262626]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connections-title"
      >
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="font-mono text-[8px] tracking-[1.5px] text-neutral-500">
              OBSERVER NETWORK
            </p>
            <h2 id="connections-title" className="mt-1 text-2xl">
              {title}.
            </h2>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center border border-neutral-700 font-mono text-xs hover:border-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="max-h-[55vh] overflow-y-auto p-3">
          {loading && (
            <p className="p-8 text-center font-mono text-[9px] text-neutral-500">
              LOCATING OBSERVERS...
            </p>
          )}
          {error && (
            <p className="border border-red-950 p-4 text-xs text-red-300">
              {error}
            </p>
          )}
          {!loading && !error && !connections.length && (
            <p className="p-8 text-center text-sm text-neutral-500">
              No observers here yet.
            </p>
          )}
          {!loading &&
            connections.map((connection) => (
              <Link
                key={connection.id}
                className="flex items-center gap-4 border-b border-neutral-800 p-4 transition hover:bg-neutral-900"
                to={`/profile/${connection.id}`}
                onClick={onClose}
              >
                <UserAvatar
                  person={connection}
                  className="size-12 text-sm text-neutral-300"
                />
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-medium">
                    {connection.displayName || "Astrovia Explorer"}
                  </strong>
                  <small className="mt-1 block truncate font-mono text-[9px] text-neutral-500">
                    @{connection.username || "unnamed_observer"}
                  </small>
                </span>
                <span className="ml-auto font-mono text-[9px] text-neutral-500">
                  VIEW →
                </span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
