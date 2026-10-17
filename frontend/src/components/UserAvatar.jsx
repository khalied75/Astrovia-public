function userInitials(name) {
  return (name || "Astrovia Explorer")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserAvatar({ person, className = "", alt = "" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900 ${className}`}
    >
      {person?.photoURL ? (
        <img className="size-full object-cover" src={person.photoURL} alt={alt} />
      ) : (
        userInitials(person?.displayName)
      )}
    </span>
  );
}
