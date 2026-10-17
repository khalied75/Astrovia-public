import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { adminSessionKey } from "../../services/adminSession";

const inputClass =
  "w-full border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-sm text-white outline-none transition focus:border-neutral-300";

export default function AdminAccessGate({ user, onUnlocked }) {
  const [mode, setMode] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const idToken = await user.getIdToken();
        const status = await api.getAdminSecurityStatus(idToken);
        if (!active) return;
        if (!status.configured) {
          setMode("setup");
          return;
        }

        const storedToken = sessionStorage.getItem(adminSessionKey(user.uid));
        if (!storedToken) {
          setMode("unlock");
          return;
        }

        try {
          await api.verifyAdminSession(idToken, storedToken);
          if (active) onUnlocked(storedToken);
        } catch {
          sessionStorage.removeItem(adminSessionKey(user.uid));
          if (active) setMode("unlock");
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
        setMode("error");
      }
    }

    checkAccess();
    return () => {
      active = false;
    };
  }, [onUnlocked, user]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (mode === "setup" && password !== confirm) {
      setError("The security passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      const session =
        mode === "setup"
          ? await api.setupAdminPassword(idToken, password)
          : await api.unlockAdmin(idToken, password);
      sessionStorage.setItem(adminSessionKey(user.uid), session.token);
      setPassword("");
      setConfirm("");
      onUnlocked(session.token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto grid min-h-[65vh] w-[min(900px,calc(100%_-_40px))] place-items-center py-12">
      <div className="w-full max-w-[470px] border border-neutral-700 bg-neutral-950 p-8 shadow-[8px_8px_0_#262626] max-[560px]:p-6">
        <div className="mb-7 flex items-start justify-between gap-5 border-b border-neutral-800 pb-6">
          <div>
            <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-500">
              ADMIN / SECOND SECURITY LAYER
            </p>
            <h1 className="text-3xl tracking-[-1px]">
              {mode === "setup" ? "Create admin access." : "Confirm access."}
            </h1>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-neutral-600 font-mono text-sm">
            ×
          </span>
        </div>

        {mode === "checking" ? (
          <p className="py-8 text-center font-mono text-[9px] tracking-[1px] text-neutral-500">
            VERIFYING SECURITY LAYER...
          </p>
        ) : mode === "error" ? (
          <p className="border border-red-950 bg-red-950/20 p-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            <p className="text-sm leading-6 text-neutral-400">
              {mode === "setup"
                ? "This password protects the moderation panel. Use at least 10 characters and keep it separate from your sign-in password."
                : "Enter your admin security password to open the moderation panel for this browser session."}
            </p>
            <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
              ADMIN SECURITY PASSWORD
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength="10"
                maxLength="128"
                required
                autoFocus
              />
            </label>
            {mode === "setup" && (
              <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
                CONFIRM SECURITY PASSWORD
                <input
                  className={inputClass}
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  minLength="10"
                  maxLength="128"
                  required
                />
              </label>
            )}
            {error && (
              <p className="border border-red-950 bg-red-950/20 p-3 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
            <button
              className="mt-2 flex min-h-12 items-center justify-between border border-white bg-white px-5 font-mono text-[9px] font-bold text-black uppercase transition hover:bg-neutral-300 disabled:cursor-wait disabled:opacity-50"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Verifying..."
                : mode === "setup"
                  ? "Create and enter"
                  : "Enter admin panel"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
