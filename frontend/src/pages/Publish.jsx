import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PostPreview from "../components/publish/PostPreview";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import { questionTypes } from "../data/questionTypes";

const topics = ["Observation", "Astrophotography", "Discovery", "Question", "General"];
const fieldClass =
  "w-full border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-200";

export default function Publish() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState(
    searchParams.get("type") === "question" ? "Question" : topics[0],
  );
  const [questionType, setQuestionType] = useState(questionTypes[0]);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  function chooseImages(event) {
    const files = [...(event.target.files || [])];
    setError("");
    if (!files.length) {
      setImages([]);
      setPreviews([]);
      return;
    }
    if (files.length > 3) {
      event.target.value = "";
      setError("You can attach up to 3 images per post.");
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      event.target.value = "";
      setError("Each image must be 10 MB or smaller.");
      return;
    }
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPublished(false);
    try {
      const token = await user.getIdToken(true);
      const uploadedImages = await Promise.all(
        images.map((image) => api.uploadPostImage(token, image)),
      );
      await api.createPost(token, {
        content: content.trim(),
        topic,
        questionType: topic === "Question" ? questionType : undefined,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        mediaUrls: uploadedImages.map((image) => image.url),
        mediaType: uploadedImages.length ? "image" : undefined,
      });
      setPublished(true);
      setContent("");
      setTags("");
      setImages([]);
      setPreviews([]);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-[min(1100px,calc(100%_-_40px))] py-12">
      <header className="mb-9 border-b border-neutral-800 pb-6">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">01 / PUBLISH SIGNAL</p>
        <h1 className="text-4xl tracking-[-1.5px]">Share an observation.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">Publish astronomy notes, questions, discoveries, and images from your corner of Earth.</p>
      </header>

      <div className="grid grid-cols-[1fr_320px] gap-10 max-[820px]:grid-cols-1">
        <form className="grid gap-5" onSubmit={submit}>
          <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
            YOUR TRANSMISSION
            <textarea className={`${fieldClass} min-h-48 resize-y font-sans leading-7`} value={content} onChange={(event) => setContent(event.target.value)} maxLength="3000" placeholder="What did you observe?" required />
            <span className="text-right text-neutral-600">{content.length} / 3000</span>
          </label>

          <div className="grid grid-cols-2 gap-5 max-[560px]:grid-cols-1">
            <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
              TOPIC
              <select className={fieldClass} value={topic} onChange={(event) => setTopic(event.target.value)}>
                {topics.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
              TAGS / COMMA SEPARATED
              <input className={fieldClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="moon, telescope" />
            </label>
          </div>

          {topic === "Question" && (
            <label className="grid gap-2 border border-neutral-800 p-4 font-mono text-[9px] tracking-[1px] text-neutral-400">
              QUESTION FIELD
              <select
                className={fieldClass}
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value)}
              >
                {questionTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <span className="text-[9px] leading-5 text-neutral-600">
                Your question will appear in this field on the Questions page.
              </span>
            </label>
          )}

          <label className="grid cursor-pointer gap-3 border border-dashed border-neutral-700 p-5 transition hover:border-neutral-400">
            <span className="font-mono text-[9px] tracking-[1px] text-neutral-400">IMAGES / OPTIONAL / MAXIMUM 3</span>
            <span className="text-sm">{images.length ? `${images.length} image${images.length > 1 ? "s" : ""} selected` : "Select up to 3 JPG, PNG, WebP, or GIF images · 10 MB each"}</span>
            <input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImages} />
          </label>

          {error && <p role="alert" className="border border-red-900 bg-red-950/30 px-4 py-3 text-xs text-red-300">{error}</p>}
          {published && <p role="status" className="border border-neutral-600 px-4 py-3 text-xs text-neutral-200">Signal published successfully. <Link className="underline underline-offset-4" to="/">Return to the feed</Link></p>}

          <button className="flex min-h-14 items-center justify-between border border-white bg-white px-5 font-mono text-[10px] text-black uppercase shadow-[6px_6px_0_#525252] transition hover:-translate-y-0.5 disabled:opacity-50" disabled={busy}>
            {busy ? "Transmitting..." : "Publish signal"}<span>↗</span>
          </button>
        </form>

        <PostPreview
          user={user}
          profile={profile}
          content={content}
          topic={topic}
          previews={previews}
        />
      </div>
    </section>
  );
}
