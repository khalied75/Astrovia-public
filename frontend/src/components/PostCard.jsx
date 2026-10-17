import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import CommentsSection from "./CommentsSection";
import ReportPostButton from "./ReportPostButton";

const actionClass =
  "inline-flex min-h-9 items-center gap-2 py-1 font-mono text-[11px] text-neutral-400 transition-colors hover:text-white aria-pressed:text-white max-[600px]:gap-1.5 max-[600px]:text-[10px]";

function Icon({ name, filled = false }) {
  return (
    <svg
      className="size-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "like" && (
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      )}
      {name === "comment" && (
        <path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-4.8a9 9 0 1 1 16.6-4.7Z" />
      )}
      {name === "save" && <path d="M6 3h12v18l-6-4-6 4Z" />}
    </svg>
  );
}

export default function PostCard({
  post,
  onDeleted,
  onSavedChange,
  initialCommentsOpen = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(Boolean(post.likedByViewer));
  const [likeCount, setLikeCount] = useState(post.likes ?? post.likesCount ?? 0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saved, setSaved] = useState(Boolean(post.savedByViewer));
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [actionError, setActionError] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);
  const [commentCount, setCommentCount] = useState(
    post.commentsCount ?? post.comments?.length ?? 0,
  );
  const [activeImage, setActiveImage] = useState(null);
  const date = new Date(post.createdAt);
  const authorName = post.author.name || post.author.displayName || "Astrovia Explorer";
  const username = post.author.username || authorName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const authorInitials = post.author.initials || authorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const mediaItems = post.mediaUrls?.length
    ? post.mediaUrls.slice(0, 3).map((url, index) => ({
        url,
        alt: `Astronomy image ${index + 1} shared with this post`,
      }))
    : post.mediaUrl
      ? [{ url: post.mediaUrl, alt: "Astronomy image shared with this post" }]
      : post.media
        ? [post.media]
        : [];

  useEffect(() => {
    if (activeImage === null) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) {
      if (event.key === "Escape") setActiveImage(null);
      if (event.key === "ArrowLeft") {
        setActiveImage((current) =>
          current === null ? null : (current - 1 + mediaItems.length) % mediaItems.length,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveImage((current) =>
          current === null ? null : (current + 1) % mediaItems.length,
        );
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeImage, mediaItems.length]);

  async function toggleLike() {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (likeBusy) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!previousLiked);
    setLikeCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)));
    setLikeBusy(true);
    try {
      const token = await user.getIdToken();
      const result = await api.togglePostLike(token, post.id);
      setLiked(result.liked);
      setLikeCount(result.likesCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSave() {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (saveBusy) return;

    const previous = saved;
    setSaved(!previous);
    setSaveBusy(true);
    setActionError("");
    try {
      const token = await user.getIdToken();
      const result = await api.togglePostSave(token, post.id);
      setSaved(result.saved);
      onSavedChange?.(post.id, result.saved);
    } catch (error) {
      setSaved(previous);
      setActionError(error.message);
    } finally {
      setSaveBusy(false);
    }
  }

  async function removePost() {
    if (!user || user.uid !== post.authorId || deleteBusy) return;
    if (!window.confirm("Delete this post permanently?")) return;

    setDeleteBusy(true);
    setActionError("");
    try {
      const token = await user.getIdToken();
      await api.deletePost(token, post.id);
      setDeleted(true);
      onDeleted?.(post.id);
    } catch (error) {
      setActionError(error.message);
      setDeleteBusy(false);
    }
  }

  if (deleted) return null;

  return (
    <article
      className="min-w-0 border border-neutral-700 bg-[#0d0d0d] p-6 max-[600px]:px-3.5 max-[600px]:py-4"
      aria-label={`Post by ${authorName}`}
    >
      <header className="flex items-center gap-3 max-[600px]:flex-wrap max-[600px]:gap-2.5">
        <Link
          className="grid size-[43px] shrink-0 place-items-center rounded-full border border-neutral-600 bg-neutral-800 font-mono text-xs max-[600px]:size-[35px]"
          to={`/profile/${post.authorId}`}
          aria-label={`View ${authorName}'s profile`}
        >
          {post.author.photoURL ? <img className="size-full rounded-full object-cover" src={post.author.photoURL} alt="" /> : authorInitials}
        </Link>
        <div className="min-w-0">
          <h2 className="mb-1.5 text-sm font-medium">
            <Link className="hover:underline hover:underline-offset-4" to={`/profile/${post.authorId}`}>
              {authorName}
            </Link>
          </h2>
          <span className="font-mono text-[10px] leading-relaxed text-neutral-400 max-[600px]:text-[9px]">
            @{username}{" "}
            <span className="mx-1" aria-hidden="true">
              ·
            </span>
            <time dateTime={post.createdAt}>
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.uid === post.authorId && (
            <button
              type="button"
              className="px-2 py-1.5 font-mono text-[8px] text-neutral-500 uppercase hover:text-red-300 disabled:opacity-50"
              onClick={removePost}
              disabled={deleteBusy}
            >
              {deleteBusy ? "Deleting..." : "Delete"}
            </button>
          )}
          <span className="border border-neutral-700 px-2 py-1.5 font-mono text-[8px] tracking-[.5px] text-neutral-400 uppercase max-[600px]:px-1.5 max-[600px]:py-1 max-[600px]:text-[7px]">
            {post.topic}
          </span>
        </div>
      </header>

      <p className="my-3 mt-5 text-base leading-8 text-neutral-200 [overflow-wrap:anywhere] whitespace-pre-wrap max-[600px]:text-[15px] max-[600px]:leading-7">
        {post.content}
      </p>
      <ul
        className="mb-6 flex list-none flex-wrap gap-3.5 p-0 font-mono text-[11px] text-neutral-400"
        aria-label="Post topics"
      >
        {post.tags.map((tag) => (
          <li key={tag}>#{tag}</li>
        ))}
      </ul>

      {mediaItems.length > 0 && (
        <figure className="m-0">
          <div className={`grid gap-1 overflow-hidden ${mediaItems.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {mediaItems.map((item, index) => (
              <button
                type="button"
                className={`group relative overflow-hidden border border-neutral-800 bg-neutral-900 disabled:cursor-default ${mediaItems.length === 1 ? "aspect-[1.95] max-[600px]:aspect-[1.45]" : mediaItems.length === 3 && index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}
                key={item.url || `illustration-${index}`}
                onClick={() => item.url && setActiveImage(index)}
                disabled={!item.url}
                aria-label={item.url ? `Open image ${index + 1} fullscreen` : item.alt}
              >
                {item.url ? (
                  <img className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" src={item.url} alt={item.alt} />
                ) : (
                  <>
                    <span className="absolute inset-0 [background-image:linear-gradient(#ffffff06_1px,transparent_1px),linear-gradient(90deg,#ffffff06_1px,transparent_1px)] [background-size:32px_32px]" />
                    <span className="absolute top-[48%] left-1/2 aspect-square w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_34%_30%,#575757_0_5%,transparent_6%),radial-gradient(circle_at_57%_62%,#6a6a6a_0_9%,transparent_10%),radial-gradient(circle_at_29%_65%,#848484_0_12%,transparent_13%),radial-gradient(circle_at_49%_20%,#7e7e7e_0_9%,transparent_10%),radial-gradient(circle_at_36%_36%,#e2e2e2,#9a9a9a_45%,#323232_70%,#0c0c0c_78%)] shadow-[inset_-22px_-9px_26px_#000b] grayscale" />
                  </>
                )}
              </button>
            ))}
          </div>
          <figcaption className="pt-2.5 font-mono text-[8px] tracking-[.5px] text-neutral-500">
            {mediaItems.length} {mediaItems.length === 1 ? "IMAGE" : "IMAGES"} / ASTROVIA COMMUNITY
          </figcaption>
        </figure>
      )}

      {activeImage !== null && mediaItems[activeImage]?.url && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveImage(null);
          }}
        >
          <img
            className="max-h-[88vh] max-w-[92vw] object-contain"
            src={mediaItems[activeImage].url}
            alt={mediaItems[activeImage].alt}
          />
          <button
            type="button"
            className="absolute top-5 right-5 grid size-11 place-items-center border border-neutral-500 bg-black font-mono text-lg text-white hover:border-white"
            onClick={() => setActiveImage(null)}
            aria-label="Close image viewer"
          >
            ×
          </button>
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-5 grid size-11 -translate-y-1/2 place-items-center border border-neutral-500 bg-black text-xl hover:border-white"
                onClick={() => setActiveImage((activeImage - 1 + mediaItems.length) % mediaItems.length)}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-5 grid size-11 -translate-y-1/2 place-items-center border border-neutral-500 bg-black text-xl hover:border-white"
                onClick={() => setActiveImage((activeImage + 1) % mediaItems.length)}
                aria-label="Next image"
              >
                →
              </button>
              <span className="absolute bottom-5 font-mono text-[10px] tracking-[2px] text-neutral-300">
                {activeImage + 1} / {mediaItems.length}
              </span>
            </>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-6 border-t border-neutral-800 pt-4 max-[600px]:gap-4">
        <button
          className={actionClass}
          aria-label={liked ? "Unlike post" : "Like post"}
          aria-pressed={liked}
          onClick={toggleLike}
          disabled={likeBusy}
        >
          <Icon name="like" filled={liked} />
          <span>{likeCount}</span>
        </button>
        <button
          className={actionClass}
          aria-expanded={commentsOpen}
          aria-controls={`comments-${post.id}`}
          onClick={() => setCommentsOpen((value) => !value)}
        >
          <Icon name="comment" />
          <span>{commentCount} comments</span>
        </button>
        <ReportPostButton postId={post.id} authorId={post.authorId} />
        <button
          className={`${actionClass} ml-auto`}
          aria-label={saved ? "Unsave post" : "Save post"}
          aria-pressed={saved}
          onClick={toggleSave}
          disabled={saveBusy}
        >
          <Icon name="save" filled={saved} />
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {actionError && (
        <p className="mt-3 text-xs text-red-300" role="alert">
          {actionError}
        </p>
      )}

      {commentsOpen && (
        <CommentsSection
          id={`comments-${post.id}`}
          postId={post.id}
          postAuthorId={post.authorId}
          onCountChange={(change) =>
            setCommentCount((current) => Math.max(0, current + change))
          }
        />
      )}
    </article>
  );
}
