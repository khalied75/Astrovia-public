import { api } from "./api";

const FEED_SIZE = 15;
const MAX_SEEN_POSTS = 500;

function storageKey(viewerId) {
  return `astrovia:seen-posts:${viewerId || "guest"}`;
}

export function readSeenPosts(viewerId) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(viewerId)) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

export function markPostSeen(viewerId, postId) {
  const seenPosts = readSeenPosts(viewerId);
  seenPosts.add(postId);
  try {
    localStorage.setItem(
      storageKey(viewerId),
      JSON.stringify([...seenPosts].slice(-MAX_SEEN_POSTS)),
    );
  } catch {
    // The feed still works when browser storage is unavailable.
  }
}

export function restartSeenPosts(viewerId) {
  try {
    localStorage.removeItem(storageKey(viewerId));
  } catch {
    // The next request can still start a fresh feed in memory.
  }
}

export async function getUnseenPosts(token, startingCursor, seenPosts) {
  const unseenPosts = [];
  let cursor = startingCursor;
  let nextCursor = startingCursor;

  do {
    const pageCursor = cursor;
    const result = await api.getPosts(token, cursor);
    unseenPosts.push(
      ...(result?.data || []).filter((post) => !seenPosts.has(post.id)),
    );
    const followingCursor = result?.pagination?.nextCursor || null;
    if (unseenPosts.length >= FEED_SIZE) {
      nextCursor =
        unseenPosts.length > FEED_SIZE ? pageCursor : followingCursor;
      break;
    }
    if (!followingCursor || followingCursor === cursor) {
      nextCursor = null;
      break;
    }
    cursor = followingCursor;
    nextCursor = followingCursor;
  } while (unseenPosts.length < FEED_SIZE);

  return {
    posts: unseenPosts.slice(0, FEED_SIZE),
    nextCursor,
  };
}
