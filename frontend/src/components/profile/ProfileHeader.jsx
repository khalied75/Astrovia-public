import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";

function ProfileActions({ profile, user, followLoading, onFollow }) {
  if (user?.uid === profile.id) {
    return (
      <Link
        className="min-w-36 border border-neutral-500 px-5 py-3 text-center font-mono text-[9px] uppercase"
        to="/account"
      >
        Edit profile
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-3 max-[560px]:justify-start">
      {user ? (
        <button
          type="button"
          className={`min-w-32 border px-5 py-3 text-center font-mono text-[9px] uppercase transition disabled:opacity-50 ${profile.followedByViewer ? "border-neutral-500 bg-transparent text-white" : "border-white bg-white text-black shadow-[4px_4px_0_#525252]"}`}
          onClick={onFollow}
          disabled={followLoading}
        >
          {followLoading
            ? "Updating..."
            : profile.followedByViewer
              ? "Following ✓"
              : "+ Follow"}
        </button>
      ) : (
        <Link
          className="min-w-32 border border-white bg-white px-5 py-3 text-center font-mono text-[9px] text-black uppercase shadow-[4px_4px_0_#525252]"
          to="/login"
          state={{ from: `/profile/${profile.id}` }}
        >
          + Follow
        </Link>
      )}
      <Link
        className="min-w-32 border border-neutral-500 px-5 py-3 text-center font-mono text-[9px] uppercase transition hover:border-white"
        to={user ? `/messages/${profile.id}` : "/login"}
        state={user ? undefined : { from: `/messages/${profile.id}` }}
      >
        Message →
      </Link>
    </div>
  );
}

export default function ProfileHeader({
  profile,
  user,
  followLoading,
  followError,
  onFollow,
  onOpenConnections,
}) {
  return (
    <div className="grid grid-cols-[220px_1fr] gap-14 max-[680px]:grid-cols-1 max-[680px]:gap-8">
      <UserAvatar
        person={profile}
        className="aspect-square w-full text-6xl text-neutral-400 max-[680px]:size-40"
        alt={`${profile.displayName}'s profile`}
      />
      <div>
        <div className="flex items-start justify-between gap-5 max-[560px]:flex-col">
          <div>
            <span className="font-mono text-[10px] text-neutral-500">
              @{profile.username || "unnamed_observer"}
            </span>
            <h1 className="mt-3 mb-5 text-5xl tracking-[-2px] max-[600px]:text-4xl">
              {profile.displayName}
            </h1>
          </div>
          <ProfileActions
            profile={profile}
            user={user}
            followLoading={followLoading}
            onFollow={onFollow}
          />
        </div>
        {followError && (
          <p className="mb-5 border border-red-950 px-3 py-2 text-xs text-red-300">
            {followError}
          </p>
        )}
        <p className="max-w-xl text-base leading-8 text-neutral-300">
          {profile.bio || "This observer has not written a bio yet."}
        </p>
        <div className="mt-5 flex gap-7 font-mono text-[9px] uppercase text-neutral-400">
          {[
            ["followers", profile.followerCount || 0],
            ["following", profile.followingCount || 0],
          ].map(([type, count]) => (
            <button
              type="button"
              key={type}
              className="border-b border-transparent pb-1 text-left transition hover:border-white hover:text-white"
              onClick={() => onOpenConnections(type)}
            >
              <strong className="mr-1.5 text-sm text-white">{count}</strong>
              {type}
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-neutral-800 pt-6 font-mono text-[9px] uppercase text-neutral-400">
          {profile.location && <span>⌖ {profile.location}</span>}
          {profile.website && (
            <a
              className="underline underline-offset-4 hover:text-white"
              href={profile.website}
              target="_blank"
              rel="noreferrer"
            >
              Website ↗
            </a>
          )}
          <span>
            Joined{" "}
            {profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "Astrovia"}
          </span>
        </div>
      </div>
    </div>
  );
}
