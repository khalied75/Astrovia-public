import PostCard from "../PostCard";

export default function AccountLibrary({
  activeTab,
  onTabChange,
  myPosts,
  savedPosts,
  loading,
  onDeleted,
  onSavedChange,
}) {
  const displayedPosts = activeTab === "posts" ? myPosts : savedPosts;

  return (
    <section
      className="mt-16 border-t border-neutral-800 pt-9"
      aria-labelledby="account-library-title"
    >
      <div className="mb-7 flex items-end justify-between gap-5 max-[600px]:items-start max-[600px]:flex-col">
        <div>
          <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-500">
            PERSONAL ARCHIVE / FIRESTORE
          </p>
          <h2 className="text-3xl tracking-[-1px]" id="account-library-title">
            Your library.
          </h2>
        </div>
        <div className="flex border border-neutral-700 p-1">
          <button
            type="button"
            className={`px-4 py-2 font-mono text-[9px] uppercase ${activeTab === "posts" ? "bg-white text-black" : "text-neutral-400"}`}
            onClick={() => onTabChange("posts")}
          >
            Your posts ({myPosts.length})
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-mono text-[9px] uppercase ${activeTab === "saved" ? "bg-white text-black" : "text-neutral-400"}`}
            onClick={() => onTabChange("saved")}
          >
            Saved ({savedPosts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="border border-neutral-800 px-5 py-10 text-center font-mono text-[9px] text-neutral-500">
          LOADING ARCHIVE...
        </p>
      ) : (
        <div className="grid gap-6">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={onDeleted}
              onSavedChange={onSavedChange}
            />
          ))}
          {!displayedPosts.length && (
            <p className="border border-neutral-800 px-5 py-10 text-center text-sm text-neutral-500">
              {activeTab === "posts"
                ? "You have not published any observations yet."
                : "You have not saved any observations yet."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
