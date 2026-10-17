import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";

const inputClass =
  "w-full border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-300";

export default function ProfileEditor({
  user,
  form,
  displayedPhoto,
  photoFile,
  busy,
  error,
  message,
  onChange,
  onChoosePhoto,
  onSubmit,
}) {
  return (
    <div className="grid grid-cols-[260px_1fr] gap-12 max-[760px]:grid-cols-1 max-[760px]:gap-8">
      <aside>
        <UserAvatar
          person={{
            displayName: form.displayName || user.email,
            photoURL: displayedPhoto,
          }}
          className="aspect-square w-full text-6xl text-neutral-400 max-[760px]:size-36"
          alt="Profile preview"
        />
        <p className="mt-5 break-all font-mono text-[9px] leading-5 text-neutral-500">
          UID / {user.uid}
        </p>
        <p className="mt-2 break-all text-xs text-neutral-400">{user.email}</p>
        <Link
          className="mt-5 inline-block font-mono text-[9px] uppercase underline underline-offset-4"
          to={`/profile/${user.uid}`}
        >
          View public profile ↗
        </Link>
      </aside>

      <form
        className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1"
        onSubmit={onSubmit}
      >
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          DISPLAY NAME
          <input
            className={inputClass}
            name="displayName"
            value={form.displayName}
            onChange={onChange}
            minLength="2"
            maxLength="50"
            required
          />
        </label>
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          USERNAME
          <input
            className={inputClass}
            name="username"
            value={form.username}
            onChange={onChange}
            pattern="[a-zA-Z0-9_]+"
            minLength="3"
            maxLength="24"
            placeholder="orbit_name"
            required
          />
        </label>
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          LOCATION
          <input
            className={inputClass}
            name="location"
            value={form.location}
            onChange={onChange}
            maxLength="80"
            placeholder="Amman, Earth"
          />
        </label>
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          WEBSITE
          <input
            className={inputClass}
            type="url"
            name="website"
            value={form.website}
            onChange={onChange}
            placeholder="https://example.com"
          />
        </label>
        <label className="col-span-2 grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400 max-[600px]:col-span-1">
          PROFILE PHOTO / OPTION 1: URL
          <input
            className={inputClass}
            type="url"
            name="photoURL"
            value={form.photoURL}
            onChange={onChange}
            placeholder="https://..."
          />
        </label>
        <label className="col-span-2 grid cursor-pointer gap-3 border border-dashed border-neutral-700 p-5 font-mono text-[9px] tracking-[1px] text-neutral-400 transition hover:border-neutral-400 max-[600px]:col-span-1">
          PROFILE PHOTO / OPTION 2: UPLOAD
          <span className="font-sans text-sm tracking-normal text-neutral-200">
            {photoFile
              ? photoFile.name
              : "Choose JPG, PNG, WebP, or GIF · maximum 10 MB"}
          </span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onChoosePhoto}
          />
        </label>
        <label className="col-span-2 grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400 max-[600px]:col-span-1">
          BIO
          <textarea
            className={`${inputClass} min-h-32 resize-y font-sans leading-6`}
            name="bio"
            value={form.bio}
            onChange={onChange}
            maxLength="240"
            placeholder="Tell other observers about yourself..."
          />
          <span className="text-right text-neutral-600">
            {form.bio.length} / 240
          </span>
        </label>

        <div className="col-span-2 max-[600px]:col-span-1">
          {error && (
            <p
              role="alert"
              className="mb-4 border border-red-900 bg-red-950/30 px-4 py-3 text-xs text-red-300"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mb-4 border border-neutral-700 px-4 py-3 text-xs text-neutral-300"
            >
              {message}
            </p>
          )}
          <button
            className="flex min-h-12 w-full items-center justify-between bg-neutral-100 px-5 font-mono text-[10px] text-neutral-950 uppercase transition hover:bg-neutral-300 disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving profile..." : "Save changes"}
            <span>↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
