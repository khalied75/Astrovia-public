import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";

const reasons = [
  ["spam", "Spam or misleading"],
  ["harassment", "Harassment or hate"],
  ["misinformation", "Astronomy misinformation"],
  ["graphic_content", "Graphic or disturbing content"],
  ["copyright", "Copyright violation"],
  ["other", "Other"],
];

export default function ReportPostButton({
  postId,
  authorId,
  commentId,
  replyId,
  compact = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState("");
  const targetType = replyId ? "reply" : commentId ? "comment" : "post";
  const targetId = replyId || commentId || postId;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) {
      if (event.key === "Escape" && !submitting) setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, submitting]);

  if (user?.uid === authorId) return null;

  function showForm() {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setError("");
    setOpen(true);
  }

  async function submitReport(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const report = { reason, details };
      if (replyId) {
        await api.reportReply(token, postId, commentId, replyId, report);
      } else if (commentId) {
        await api.reportComment(token, postId, commentId, report);
      } else {
        await api.reportPost(token, postId, report);
      }
      setReported(true);
      setOpen(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          compact
            ? "border border-neutral-700 px-2 py-1 font-mono text-[9px] text-neutral-500 uppercase hover:border-red-800 hover:text-red-300 disabled:opacity-50"
            : "inline-flex min-h-9 items-center gap-2 py-1 font-mono text-[11px] text-neutral-500 transition-colors hover:text-red-300 disabled:cursor-default disabled:text-neutral-600 max-[600px]:text-[10px]"
        }
        onClick={showForm}
        disabled={reported}
      >
        {!compact && <svg
          className="size-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
        </svg>}
        <span>{reported ? "Reported" : "Report"}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/90 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`report-title-${targetType}-${targetId}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setOpen(false);
          }}
        >
          <form
            className="w-full max-w-lg border border-neutral-600 bg-neutral-950 p-6 shadow-[8px_8px_0_#262626]"
            onSubmit={submitReport}
          >
            <header className="mb-6 flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <p className="mb-2 font-mono text-[8px] tracking-[1.5px] text-neutral-500">
                  COMMUNITY SAFETY / {targetType.toUpperCase()}
                </p>
                <h2 id={`report-title-${targetType}-${targetId}`} className="text-2xl">
                  Report this {targetType}.
                </h2>
              </div>
              <button
                type="button"
                className="grid size-9 place-items-center border border-neutral-700 font-mono text-lg hover:border-white"
                onClick={() => setOpen(false)}
                disabled={submitting}
                aria-label="Close report form"
              >
                ×
              </button>
            </header>

            <label className="block font-mono text-[9px] tracking-[1px] text-neutral-400 uppercase">
              Reason
              <select
                className="mt-2 h-12 w-full border border-neutral-700 bg-neutral-950 px-3 font-sans text-sm text-white outline-none focus:border-white"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={submitting}
              >
                {reasons.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-5 block font-mono text-[9px] tracking-[1px] text-neutral-400 uppercase">
              Details {reason === "other" ? "(required)" : "(optional)"}
              <textarea
                className="mt-2 min-h-28 w-full resize-y border border-neutral-700 bg-neutral-950 p-3 font-sans text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength="1000"
                placeholder="Tell the moderation team what happened."
                required={reason === "other"}
                disabled={submitting}
              />
            </label>

            {error && (
              <p className="mt-3 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="min-h-11 border border-neutral-700 px-5 font-mono text-[9px] uppercase hover:border-white"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="min-h-11 border border-white bg-white px-5 font-mono text-[9px] text-black uppercase disabled:opacity-50"
                disabled={submitting || (reason === "other" && !details.trim())}
              >
                {submitting ? "Sending..." : "Send report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
