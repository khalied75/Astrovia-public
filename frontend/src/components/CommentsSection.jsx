import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import ReportPostButton from "./ReportPostButton";

const inputClass =
  "w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-300";

function authorName(item) {
  return item.author?.displayName || item.author?.name || "Astrovia Observer";
}

function dateLabel(value) {
  if (!value) return "JUST NOW";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReplyItem({ reply, postId, postAuthorId, comment, onDeleted }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const canDelete =
    user &&
    [reply.authorId, comment.authorId, postAuthorId].includes(user.uid);

  async function remove() {
    if (!window.confirm("Delete this reply?")) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      await api.deleteReply(token, postId, comment.id, reply.id);
      onDeleted(reply.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-l border-neutral-700 py-2 pl-4">
      <div className="flex items-center gap-2">
        <Link className="text-xs font-medium hover:underline" to={`/profile/${reply.authorId}`}>
          {authorName(reply)}
        </Link>
        <span className="font-mono text-[8px] text-neutral-600">
          {dateLabel(reply.createdAt)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ReportPostButton
            postId={postId}
            commentId={comment.id}
            replyId={reply.id}
            authorId={reply.authorId}
            compact
          />
          {canDelete && (
            <button
              type="button"
              className="border border-neutral-700 px-2 py-1 font-mono text-[9px] text-neutral-400 uppercase hover:border-red-800 hover:text-red-300"
              onClick={remove}
              disabled={busy}
            >
              {busy ? "Deleting" : "Delete"}
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-neutral-300">
        {reply.content}
      </p>
    </div>
  );
}

function CommentThread({ comment, postId, postAuthorId, onDeleted }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyCount, setReplyCount] = useState(comment.repliesCount || 0);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const canDelete = user && [comment.authorId, postAuthorId].includes(user.uid);

  async function toggleReplies() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || loaded) return;
    setLoading(true);
    try {
      setReplies((await api.getReplies(postId, comment.id)) || []);
      setLoaded(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReply(event) {
    event.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const reply = await api.addReply(token, postId, comment.id, content.trim());
      setReplies((current) => [...current, reply]);
      setReplyCount((current) => current + 1);
      setContent("");
      setLoaded(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeComment() {
    if (!window.confirm("Delete this comment and its replies?")) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      await api.deleteComment(token, postId, comment.id);
      onDeleted(comment.id);
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  }

  return (
    <article className="border-b border-neutral-800 py-4 last:border-0">
      <header className="flex items-center gap-2">
        <Link className="font-medium text-neutral-200 hover:underline" to={`/profile/${comment.authorId}`}>
          {authorName(comment)}
        </Link>
        <span className="font-mono text-[8px] text-neutral-600">
          {dateLabel(comment.createdAt)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ReportPostButton
            postId={postId}
            commentId={comment.id}
            authorId={comment.authorId}
            compact
          />
          {canDelete && (
            <button
              type="button"
              className="border border-neutral-700 px-2 py-1 font-mono text-[9px] text-neutral-400 uppercase hover:border-red-800 hover:text-red-300"
              onClick={removeComment}
              disabled={deleting}
            >
              {deleting ? "Deleting" : "Delete"}
            </button>
          )}
        </div>
      </header>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
        {comment.content}
      </p>
      <button
        type="button"
        className="mt-2 font-mono text-[9px] text-neutral-500 uppercase hover:text-white"
        onClick={toggleReplies}
      >
        {open ? "Hide replies" : `Reply / ${replyCount}`}
      </button>

      {open && (
        <div className="mt-3 ml-4 grid gap-2">
          {loading && <p className="font-mono text-[8px] text-neutral-600">LOADING REPLIES...</p>}
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              comment={comment}
              onDeleted={(replyId) => {
                setReplies((current) => current.filter((item) => item.id !== replyId));
                setReplyCount((current) => Math.max(0, current - 1));
              }}
            />
          ))}
          {user ? (
            <form className="mt-2 flex gap-2 max-[520px]:flex-col" onSubmit={submitReply}>
              <input
                className={inputClass}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength="1000"
                placeholder={`Reply to ${authorName(comment)}...`}
                required
              />
              <button
                className="border border-neutral-500 px-4 font-mono text-[9px] uppercase hover:border-white disabled:opacity-50 max-[520px]:min-h-11"
                disabled={busy}
              >
                {busy ? "Sending" : "Reply"}
              </button>
            </form>
          ) : (
            <Link className="text-xs underline underline-offset-4" to="/login">
              Sign in to reply
            </Link>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      )}
    </article>
  );
}

export default function CommentsSection({ id, postId, postAuthorId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.getComments(postId)
      .then((items) => active && setComments(items || []))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [postId]);

  async function submitComment(event) {
    event.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const comment = await api.addComment(token, postId, content.trim());
      setComments((current) => [...current, comment]);
      setContent("");
      onCountChange(1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id={id} className="mt-4 border-t border-neutral-800 pt-4" aria-label="Comments">
      {loading ? (
        <p className="py-3 font-mono text-[8px] text-neutral-600">LOADING COMMENTS...</p>
      ) : comments.length ? (
        comments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            postId={postId}
            postAuthorId={postAuthorId}
            onDeleted={(commentId) => {
              setComments((current) => current.filter((item) => item.id !== commentId));
              onCountChange(-1);
            }}
          />
        ))
      ) : (
        <p className="py-3 text-xs text-neutral-500">No comments yet. Start the conversation.</p>
      )}

      {user ? (
        <form className="mt-4 flex gap-2 max-[520px]:flex-col" onSubmit={submitComment}>
          <textarea
            className={`${inputClass} min-h-12 resize-y`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength="1000"
            placeholder="Write a comment..."
            required
          />
          <button
            className="border border-white bg-white px-5 font-mono text-[9px] text-black uppercase disabled:opacity-50 max-[520px]:min-h-11"
            disabled={busy}
          >
            {busy ? "Sending" : "Comment"}
          </button>
        </form>
      ) : (
        <Link className="mt-4 inline-block text-xs underline underline-offset-4" to="/login">
          Sign in to comment
        </Link>
      )}
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </section>
  );
}
