import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/auth-context";
import { questionTypes } from "../data/questionTypes";
import { api } from "../services/api";

export default function Questions() {
  const { user, loading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    async function loadQuestions() {
      setLoading(true);
      setError("");
      try {
        const token = user ? await user.getIdToken() : undefined;
        const items = await api.getQuestions(token, selectedType);
        if (active) setQuestions(items || []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadQuestions();
    return () => {
      active = false;
    };
  }, [authLoading, selectedType, user]);

  return (
    <section className="mx-auto min-h-[75vh] w-[min(900px,calc(100%_-_40px))] py-12">
      <header className="mb-8 border-b border-neutral-800 pb-7">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
          04 / COMMUNITY QUESTIONS
        </p>
        <div className="flex items-end justify-between gap-8 max-[650px]:items-start max-[650px]:flex-col">
          <div>
            <h1 className="text-4xl tracking-[-1.5px]">Ask the universe.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-400">
              Only question posts appear here. Choose a field to focus the feed.
            </p>
          </div>
          <Link
            className="border border-white bg-white px-5 py-3 font-mono text-[9px] text-black uppercase shadow-[4px_4px_0_#525252]"
            to="/publish?type=question"
          >
            Ask a question +
          </Link>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-2" aria-label="Question type filters">
        {["", ...questionTypes].map((type) => (
          <button
            type="button"
            key={type || "all"}
            className={`border px-3 py-2 font-mono text-[9px] uppercase transition ${selectedType === type ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-400 hover:border-neutral-400 hover:text-white"}`}
            onClick={() => setSelectedType(type)}
          >
            {type || "All questions"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="border border-neutral-800 px-5 py-12 text-center font-mono text-[9px] text-neutral-500">
          SEARCHING THE ARCHIVE...
        </p>
      ) : (
        <div className="grid gap-6">
          {questions.map((question) => (
            <div key={question.id}>
              <p className="border-x border-t border-neutral-700 bg-neutral-900 px-5 py-2 font-mono text-[9px] text-neutral-400 uppercase">
                {question.questionType || "General Astronomy"}
              </p>
              <PostCard
                post={question}
                onDeleted={(postId) =>
                  setQuestions((current) => current.filter((item) => item.id !== postId))
                }
                onSavedChange={(postId, saved) =>
                  setQuestions((current) =>
                    current.map((item) =>
                      item.id === postId ? { ...item, savedByViewer: saved } : item,
                    ),
                  )
                }
              />
            </div>
          ))}
          {!questions.length && (
            <p className="border border-neutral-800 px-5 py-12 text-center text-sm text-neutral-500">
              No questions have been published in this field yet.
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-center text-xs text-red-300">{error}</p>}
    </section>
  );
}
