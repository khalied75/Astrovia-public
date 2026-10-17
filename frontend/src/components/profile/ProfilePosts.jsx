import PostCard from "../PostCard";

export default function ProfilePosts({ profile, posts, onDeleted, onSavedChange }) {
  return (
    <div className="mt-16 border-t border-neutral-800 pt-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-2 font-mono text-[9px] tracking-[1px] text-neutral-500">
            PUBLIC TRANSMISSIONS
          </p>
          <h2 className="text-2xl">Observations by {profile.displayName}.</h2>
        </div>
        <span className="font-mono text-[9px] text-neutral-500">
          {posts.length} POSTS
        </span>
      </div>
      <div className="grid gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={onDeleted}
            onSavedChange={onSavedChange}
          />
        ))}
        {!posts.length && (
          <p className="border border-neutral-800 px-5 py-10 text-center text-sm text-neutral-500">
            This observer has not published anything yet.
          </p>
        )}
      </div>
    </div>
  );
}
