import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ConnectionsDialog from "../components/profile/ConnectionsDialog";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfilePosts from "../components/profile/ProfilePosts";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";

const EMPTY_CONNECTIONS = {
  type: "",
  items: [],
  loading: false,
  error: "",
};

export default function PublicProfile() {
  const { userId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState("");
  const [connections, setConnections] = useState(EMPTY_CONNECTIONS);
  const [result, setResult] = useState({
    userId: null,
    profile: null,
    posts: [],
    error: "",
  });

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;

    async function loadProfile() {
      try {
        const token = user ? await user.getIdToken() : undefined;
        const [profile, posts] = await Promise.all([
          api.getProfile(userId, token),
          api.getUserPosts(userId, token),
        ]);
        if (active) setResult({ userId, profile, posts: posts || [], error: "" });
      } catch (requestError) {
        if (active) {
          setResult({
            userId,
            profile: null,
            posts: [],
            error: requestError.message,
          });
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [authLoading, user, userId]);

  const loading = result.userId !== userId;
  const { profile, posts, error } = result;

  async function handleFollow() {
    if (!user || followLoading) return;
    setFollowLoading(true);
    setFollowError("");
    try {
      const follow = await api.toggleFollow(await user.getIdToken(), profile.id);
      setResult((current) => ({
        ...current,
        profile: {
          ...current.profile,
          followedByViewer: follow.followed,
          followerCount: follow.followerCount,
        },
      }));
    } catch (requestError) {
      setFollowError(requestError.message);
    } finally {
      setFollowLoading(false);
    }
  }

  async function openConnections(type) {
    setConnections({ type, items: [], loading: true, error: "" });
    try {
      const items =
        type === "followers"
          ? await api.getFollowers(profile.id)
          : await api.getFollowing(profile.id);
      setConnections({ type, items: items || [], loading: false, error: "" });
    } catch (requestError) {
      setConnections({
        type,
        items: [],
        loading: false,
        error: requestError.message,
      });
    }
  }

  function deletePost(postId) {
    setResult((current) => ({
      ...current,
      posts: current.posts.filter((post) => post.id !== postId),
    }));
  }

  function updateSavedPost(postId, saved) {
    setResult((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId ? { ...post, savedByViewer: saved } : post,
      ),
    }));
  }

  if (loading) {
    return (
      <div className="grid min-h-[65vh] place-items-center font-mono text-xs text-neutral-400">
        LOCATING OBSERVER...
      </div>
    );
  }

  if (error) {
    return (
      <section className="mx-auto grid min-h-[65vh] w-[min(740px,calc(100%_-_40px))] place-items-center text-center">
        <div>
          <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-400">
            PROFILE / NOT FOUND
          </p>
          <h1 className="my-4 text-4xl">
            This observer is beyond our coordinates.
          </h1>
          <p className="mb-7 text-sm text-neutral-400">{error}</p>
          <Link
            className="bg-neutral-100 px-5 py-4 font-mono text-[10px] text-neutral-950 uppercase"
            to="/"
          >
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-[70vh] w-[min(900px,calc(100%_-_40px))] py-16">
      <p className="mb-10 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
        PUBLIC PROFILE / OBSERVER {profile.id.slice(0, 8).toUpperCase()}
      </p>
      <ProfileHeader
        profile={profile}
        user={user}
        followLoading={followLoading}
        followError={followError}
        onFollow={handleFollow}
        onOpenConnections={openConnections}
      />
      <ProfilePosts
        profile={profile}
        posts={posts}
        onDeleted={deletePost}
        onSavedChange={updateSavedPost}
      />
      {connections.type && (
        <ConnectionsDialog
          title={connections.type === "followers" ? "Followers" : "Following"}
          connections={connections.items}
          loading={connections.loading}
          error={connections.error}
          onClose={() => setConnections(EMPTY_CONNECTIONS)}
        />
      )}
    </section>
  );
}
