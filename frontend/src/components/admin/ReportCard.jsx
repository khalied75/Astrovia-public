import { Link } from "react-router-dom";

const reasonLabels = {
  spam: "Spam or misleading",
  harassment: "Harassment or hate",
  misinformation: "Astronomy misinformation",
  graphic_content: "Graphic content",
  copyright: "Copyright violation",
  other: "Other",
};

const statusStyles = {
  pending: "border-amber-700 text-amber-300",
  resolved: "border-emerald-800 text-emerald-300",
  dismissed: "border-neutral-700 text-neutral-400",
  post_deleted: "border-red-900 text-red-300",
  content_deleted: "border-red-900 text-red-300",
};

export default function ReportCard({ report, busy, onStatus, onDeleteContent }) {
  const targetType = report.targetType || "post";
  const deleted = ["post_deleted", "content_deleted"].includes(report.status);
  const snapshot =
    targetType === "post"
      ? report.postSnapshot || {}
      : report.contentSnapshot || {};
  const authorName = snapshot.author?.displayName || "Unknown author";
  const createdAt = report.createdAt
    ? new Date(report.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Processing";

  return (
    <article className="border border-neutral-700 bg-[#0d0d0d]">
      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-800 px-5 py-4">
        <span
          className={`border px-2 py-1 font-mono text-[8px] uppercase ${statusStyles[report.status] || statusStyles.dismissed}`}
        >
          {report.status?.replace("_", " ")}
        </span>
        <strong className="font-mono text-[10px] text-neutral-300">
          {reasonLabels[report.reason] || report.reason}
        </strong>
        <time className="ml-auto font-mono text-[8px] text-neutral-600">
          {createdAt}
        </time>
      </header>

      <div className="grid grid-cols-[1fr_220px] gap-6 p-5 max-[760px]:grid-cols-1">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[8px] tracking-[1px] text-neutral-500">
            REPORTED {targetType.toUpperCase()} / {report.postSnapshot?.topic || "GENERAL"}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-200 [overflow-wrap:anywhere]">
            {snapshot.content || `The ${targetType} content is unavailable.`}
          </p>
          {targetType === "post" && snapshot.mediaUrls?.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {snapshot.mediaUrls.slice(0, 3).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    className="h-24 w-32 border border-neutral-800 object-cover"
                    src={url}
                    alt="Reported post attachment"
                  />
                </a>
              ))}
            </div>
          )}
          <div className="mt-5 border-l border-neutral-700 pl-4">
            <p className="font-mono text-[8px] text-neutral-500">REPORT DETAILS</p>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              {report.details || "No additional details were provided."}
            </p>
          </div>
        </div>

        <aside className="border-l border-neutral-800 pl-5 text-xs leading-6 max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:pt-5 max-[760px]:pl-0">
          <p className="font-mono text-[8px] text-neutral-600">
            {targetType.toUpperCase()} AUTHOR
          </p>
          <Link
            className="mt-1 block text-neutral-200 hover:underline"
            to={`/profile/${report.targetAuthorId || report.postAuthorId}`}
          >
            {authorName}
          </Link>
          <p className="mt-4 font-mono text-[8px] text-neutral-600">REPORTED BY</p>
          <Link
            className="mt-1 block text-neutral-200 hover:underline"
            to={`/profile/${report.reporterId}`}
          >
            {report.reporter?.displayName || "Astrovia Observer"}
          </Link>
          {!deleted && (
            <Link
              className="mt-5 inline-block border border-neutral-700 px-3 py-2 font-mono text-[8px] uppercase hover:border-white"
              to={`/?post=${report.postId}${targetType === "post" ? "" : `#comments-${report.postId}`}`}
            >
              Open post ↗
            </Link>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap justify-end gap-3 border-t border-neutral-800 p-4">
        {report.status !== "dismissed" && (
          <button
            type="button"
            className="min-h-10 border border-neutral-700 px-4 font-mono text-[8px] uppercase hover:border-white disabled:opacity-40"
            onClick={() => onStatus(report.id, "dismissed")}
            disabled={busy}
          >
            Dismiss report
          </button>
        )}
        {report.status !== "resolved" && !deleted && (
          <button
            type="button"
            className="min-h-10 border border-neutral-500 px-4 font-mono text-[8px] uppercase hover:border-white disabled:opacity-40"
            onClick={() => onStatus(report.id, "resolved")}
            disabled={busy}
          >
            Mark resolved
          </button>
        )}
        {!deleted && (
          <button
            type="button"
            className="min-h-10 border border-red-900 px-4 font-mono text-[8px] text-red-300 uppercase hover:border-red-500 disabled:opacity-40"
            onClick={() => onDeleteContent(report)}
            disabled={busy}
          >
            {busy ? "Processing..." : `Delete ${targetType}`}
          </button>
        )}
      </footer>
    </article>
  );
}
