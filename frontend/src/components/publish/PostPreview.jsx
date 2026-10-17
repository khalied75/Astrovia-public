import UserAvatar from "../UserAvatar";

export default function PostPreview({ user, profile, content, topic, previews }) {
  const displayName =
    profile?.displayName || user.displayName || "Astrovia Explorer";
  const avatar = {
    displayName: profile?.displayName || user.email || "A",
    photoURL: profile?.photoURL || user.photoURL,
  };

  return (
    <aside className="border border-neutral-800 p-5">
      <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-500">
        LIVE PREVIEW / EARTH ORBIT
      </p>
      <div className="mt-5 flex items-center gap-3 border-b border-neutral-800 pb-4">
        <UserAvatar person={avatar} className="size-10 text-xs" />
        <div>
          <p className="text-sm">{displayName}</p>
          <p className="mt-1 font-mono text-[8px] text-neutral-500">
            TRANSMITTING NOW
          </p>
        </div>
      </div>
      <p className="min-h-24 whitespace-pre-wrap py-5 text-sm leading-6 text-neutral-300">
        {content || "Your observation will appear here..."}
      </p>
      {previews.length > 0 && (
        <div
          className={`grid gap-1 ${previews.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {previews.map((preview, index) => (
            <img
              className={`w-full border border-neutral-800 object-cover ${previews.length === 3 && index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}
              src={preview}
              alt={`Selected post preview ${index + 1}`}
              key={preview}
            />
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between font-mono text-[8px] text-neutral-500">
        <span>{topic.toUpperCase()}</span>
        <span>PUBLIC / 001</span>
      </div>
    </aside>
  );
}
