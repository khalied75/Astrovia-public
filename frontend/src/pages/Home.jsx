import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ViewedPost from "../components/feed/ViewedPost";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import {
  getUnseenPosts,
  readSeenPosts,
  restartSeenPosts,
} from "../services/feedHistory";

export default function Home() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get("post");
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
    if (loading) return undefined;
    let active = true;

    async function loadPosts() {
      setFeedLoading(true);
      setFeedError("");
      try {
        const token = user ? await user.getIdToken() : undefined;
        if (targetPostId) {
          const targetPost = await api.getPost(targetPostId, token);
          if (active) {
            setPosts([targetPost]);
            setNextCursor(null);
            setTimeout(
              () =>
                document
                  .getElementById(`comments-${targetPostId}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" }),
              0,
            );
          }
          return;
        }
        const viewerId = user?.uid || "guest";
        let seenPosts = readSeenPosts(viewerId);
        let result = await getUnseenPosts(token, null, seenPosts);

        if (!result.posts.length && !result.nextCursor && seenPosts.size) {
          restartSeenPosts(viewerId);
          seenPosts = new Set();
          result = await getUnseenPosts(token, null, seenPosts);
        }

        if (active) {
          setPosts(result.posts);
          setNextCursor(result.nextCursor);
        }
      } catch (error) {
        if (active) {
          setPosts([]);
          setNextCursor(null);
          setFeedError(error.message);
        }
      } finally {
        if (active) setFeedLoading(false);
      }
    }

    loadPosts();
    return () => {
      active = false;
    };
  }, [loading, targetPostId, user]);

  async function loadMore() {
    if (!nextCursor || moreLoading) return;
    setMoreLoading(true);
    setFeedError("");
    try {
      const token = user ? await user.getIdToken() : undefined;
      const viewerId = user?.uid || "guest";
      const seenPosts = readSeenPosts(viewerId);
      const result = await getUnseenPosts(token, nextCursor, seenPosts);
      setPosts((current) => {
        const known = new Set(current.map((post) => post.id));
        return [
          ...current,
          ...result.posts.filter((post) => !known.has(post.id)),
        ];
      });
      setNextCursor(result.nextCursor);
    } catch (error) {
      setFeedError(error.message);
    } finally {
      setMoreLoading(false);
    }
  }

  return (
    <section
      className="mx-auto min-h-[80vh] w-[min(740px,calc(100%_-_40px))] py-7 pt-12 max-[600px]:pt-8"
      aria-labelledby="feed-title"
    >
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-[8px] leading-7 tracking-[1.5px] text-neutral-400 max-[600px]:text-[7px] max-[600px]:tracking-[1px]">
            YOUR COMMUNITY / YOUR UNIVERSE
          </p>
          <h1
            id="feed-title"
            className="text-4xl leading-[1.1] font-normal tracking-[-1.5px] max-[600px]:text-[30px]"
          >
            Home feed
            <span className="text-neutral-500" aria-hidden="true">
              .
            </span>
          </h1>
        </div>
        <span className="pb-1 font-mono text-[8px] tracking-[1px] whitespace-nowrap text-neutral-400 max-[600px]:text-[7px]">
          LATEST POSTS ↓
        </span>
      </header>

      <Link
        className="mb-6 flex items-center gap-4 border border-neutral-700 bg-neutral-900 p-6 text-sm transition-colors hover:border-neutral-500 max-[600px]:gap-3 max-[600px]:px-3.5 max-[600px]:py-4 max-[600px]:text-xs"
        to="/publish"
      >
        <span
          className="grid size-[43px] shrink-0 place-items-center rounded-full border border-neutral-600 text-[28px] text-neutral-400 max-[600px]:size-[35px]"
          aria-hidden="true"
        >
          ◎
        </span>
        <span>
          What’s happening in your universe?
          <small className="mt-1.5 block text-[11px] leading-6 text-neutral-500 max-[600px]:text-[10px]">
            Share an observation, a photo, or a thought.
          </small>
        </span>
        <span className="ml-auto text-2xl font-light" aria-hidden="true">
          +
        </span>
      </Link>

      <div className="grid gap-6" aria-label="Community posts">
        {posts.map((post) => (
          <ViewedPost
            key={post.id}
            postId={post.id}
            viewerId={user?.uid || "guest"}
          >
            <PostCard
              post={post}
              initialCommentsOpen={post.id === targetPostId}
              onDeleted={(postId) =>
                setPosts((current) => current.filter((item) => item.id !== postId))
              }
              onSavedChange={(postId, saved) =>
                setPosts((current) =>
                  current.map((item) =>
                    item.id === postId ? { ...item, savedByViewer: saved } : item,
                  ),
                )
              }
            />
          </ViewedPost>
        ))}
        {feedLoading && (
          <div className="border border-neutral-800 px-6 py-12 text-center font-mono text-[9px] tracking-[1.5px] text-neutral-500">
            LOCATING NEW SIGNALS...
          </div>
        )}
        {!feedLoading && !posts.length && (
          <div className="border border-neutral-800 px-6 py-12 text-center">
            <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-500">
              NO SIGNALS YET
            </p>
            <p className="mt-3 text-sm text-neutral-400">
              Be the first observer to publish from this corner of the universe.
            </p>
          </div>
        )}
      </div>

      {feedError && (
        <p className="mt-5 border border-red-950 px-4 py-3 text-center text-xs text-red-300">
          {feedError}
        </p>
      )}

      {!targetPostId && nextCursor && (
        <button
          type="button"
          className="my-7 flex min-h-13 w-full items-center justify-between border border-neutral-600 px-5 font-mono text-[10px] uppercase hover:border-white disabled:opacity-50"
          onClick={loadMore}
          disabled={moreLoading}
        >
          {moreLoading ? "Loading signals..." : "Load next 15 posts"}
          <span>↓</span>
        </button>
      )}

      {!feedLoading && !nextCursor && posts.length > 0 && (
      <p className="my-7 text-center font-mono text-[10px] text-neutral-500">
        <span
          className="mb-3 block text-2xl text-neutral-400"
          aria-hidden="true"
        >
          ✳
        </span>
        You’re all caught up.
      </p>
      )}
    </section>
  );
}
