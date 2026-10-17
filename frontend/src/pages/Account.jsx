import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountLibrary from "../components/account/AccountLibrary";
import ProfileEditor from "../components/account/ProfileEditor";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";

const EMPTY_PROFILE = {
  displayName: "",
  username: "",
  bio: "",
  location: "",
  website: "",
  photoURL: "",
};

export default function Account() {
  const { user, profile, profileError, refreshProfile, saveProfile, signOut } =
    useAuth();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [libraryTab, setLibraryTab] = useState("posts");
  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const navigate = useNavigate();

  const form = profile
    ? {
        displayName: profile.displayName || user.displayName || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        photoURL: profile.photoURL || user.photoURL || "",
        ...draft,
      }
    : EMPTY_PROFILE;
  const displayedPhoto = photoPreview || form.photoURL;

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      setLibraryLoading(true);
      try {
        const token = await user.getIdToken();
        const [owned, saved] = await Promise.all([
          api.getMyPosts(token),
          api.getSavedPosts(token),
        ]);
        if (active) {
          setMyPosts(owned || []);
          setSavedPosts(saved || []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLibraryLoading(false);
      }
    }

    loadLibrary();
    return () => {
      active = false;
    };
  }, [user]);

  function removeFromLibrary(postId) {
    setMyPosts((current) => current.filter((post) => post.id !== postId));
    setSavedPosts((current) => current.filter((post) => post.id !== postId));
  }

  function updateSavedLibrary(postId, saved) {
    setMyPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, savedByViewer: saved } : post,
      ),
    );
    setSavedPosts((current) => {
      if (!saved) return current.filter((post) => post.id !== postId);
      if (current.some((post) => post.id === postId)) {
        return current.map((post) =>
          post.id === postId ? { ...post, savedByViewer: true } : post,
        );
      }
      const ownedPost = myPosts.find((post) => post.id === postId);
      return ownedPost
        ? [{ ...ownedPost, savedByViewer: true }, ...current]
        : current;
    });
  }

  function update(event) {
    if (event.target.name === "photoURL") {
      setPhotoFile(null);
      setPhotoPreview("");
    }
    setDraft((current) => ({
      ...form,
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setError("The profile image must be 10 MB or smaller.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let photoURL = form.photoURL;
      if (photoFile) {
        const token = await user.getIdToken(true);
        const uploaded = await api.uploadProfileImage(token, photoFile);
        photoURL = uploaded.url;
      }
      const updatedProfile = await saveProfile({ ...form, photoURL });
      const updatedAuthor = {
        displayName: updatedProfile.displayName,
        username: updatedProfile.username,
        photoURL: updatedProfile.photoURL,
      };
      setMyPosts((current) =>
        current.map((post) => ({ ...post, author: updatedAuthor })),
      );
      setSavedPosts((current) =>
        current.map((post) =>
          post.authorId === user.uid
            ? { ...post, author: updatedAuthor }
            : post,
        ),
      );
      setDraft(null);
      setPhotoFile(null);
      setPhotoPreview("");
      setMessage("Profile saved. Your public page is now up to date.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    navigate("/", { replace: true });
  }

  if (!profile) {
    return (
      <section className="mx-auto grid min-h-[65vh] w-[min(740px,calc(100%_-_40px))] place-items-center text-center">
        <div>
          <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-400">
            PROFILE LINK / INTERRUPTED
          </p>
          <h1 className="my-4 text-4xl">Your Firebase account is connected.</h1>
          <p className="mx-auto mb-6 max-w-lg text-sm leading-7 text-neutral-400">
            {profileError ||
              "We could not load your Astrovia profile from the API."}
          </p>
          <button
            className="bg-neutral-100 px-5 py-4 font-mono text-[10px] text-neutral-950 uppercase"
            onClick={() => refreshProfile().catch(() => {})}
          >
            Retry connection
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-[min(1000px,calc(100%_-_40px))] py-12">
      <header className="mb-9 flex items-end justify-between border-b border-neutral-800 pb-6 max-[650px]:items-start">
        <div>
          <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
            03 / YOUR ACCOUNT
          </p>
          <h1 className="text-4xl tracking-[-1.5px]">Profile settings.</h1>
        </div>
        <button
          className="font-mono text-[9px] text-neutral-400 uppercase hover:text-white"
          onClick={logout}
        >
          Sign out ↗
        </button>
      </header>
      <ProfileEditor
        user={user}
        form={form}
        displayedPhoto={displayedPhoto}
        photoFile={photoFile}
        busy={busy}
        error={error}
        message={message}
        onChange={update}
        onChoosePhoto={choosePhoto}
        onSubmit={submit}
      />
      <AccountLibrary
        activeTab={libraryTab}
        onTabChange={setLibraryTab}
        myPosts={myPosts}
        savedPosts={savedPosts}
        loading={libraryLoading}
        onDeleted={removeFromLibrary}
        onSavedChange={updateSavedLibrary}
      />
    </section>
  );
}
