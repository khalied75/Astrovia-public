import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import ProviderIcon from "../components/auth/ProviderIcon";
import { useAuth } from "../context/auth-context";

const inputClass =
  "w-full border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-300";

function authMessage(error) {
  const messages = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/popup-closed-by-user":
      "The sign-in window was closed before completion.",
    "auth/popup-blocked":
      "The browser blocked the sign-in window. Allow popups and try again.",
    "auth/operation-not-allowed":
      "This sign-in method is not enabled in Firebase yet.",
    "auth/unauthorized-domain":
      "This domain is not authorized in Firebase Authentication.",
  };
  return (
    messages[error?.code] || error?.message || "Sign-in could not be completed."
  );
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    createAccount,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || "/account";

  if (!loading && user) return <Navigate to="/account" replace />;

  function update(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function providerSignIn(provider) {
    setBusy(provider);
    setError("");
    try {
      await (provider === "google" ? signInWithGoogle() : signInWithApple());
      navigate(destination, { replace: true });
    } catch (authError) {
      setError(authMessage(authError));
    } finally {
      setBusy("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (mode === "reset") {
      if (
        form.email.trim().toLowerCase() !==
        form.confirmEmail.trim().toLowerCase()
      ) {
        setError("The email addresses do not match.");
        return;
      }

      setBusy("reset");
      try {
        await resetPassword(form.email.trim());
        setNotice(
          "If an Astrovia account uses this email, a password reset link has been sent.",
        );
      } catch (authError) {
        setError(authMessage(authError));
      } finally {
        setBusy("");
      }
      return;
    }

    if (mode === "register" && form.password !== form.confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy("email");
    try {
      if (mode === "register")
        await createAccount(form.name, form.email, form.password);
      else await signInWithEmail(form.email, form.password);
      navigate(destination, { replace: true });
    } catch (authError) {
      setError(authMessage(authError));
    } finally {
      setBusy("");
    }
  }

  function changeMode(nextMode) {
    setError("");
    setNotice("");
    setMode(nextMode);
  }

  return (
    <section className="mx-auto grid min-h-[75vh] w-[min(1000px,calc(100%_-_40px))] grid-cols-[.9fr_1.1fr] border-x border-neutral-800 max-[760px]:grid-cols-1 max-[760px]:border-0">
      <div className="relative overflow-hidden border-r border-neutral-800 p-12 max-[760px]:hidden">
        <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-400">
          IDENTITY / ASTROVIA
        </p>
        <div className="absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-800 before:absolute before:inset-10 before:rounded-full before:border before:border-dashed before:border-neutral-700 after:absolute after:top-1/2 after:left-1/2 after:size-32 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-[radial-gradient(circle_at_35%_30%,#ddd,#555_42%,#111_72%)]" />
        <p className="absolute bottom-10 max-w-[260px] text-3xl leading-tight tracking-[-1px]">
          Every observer has a place among the stars.
        </p>
      </div>

      <div className="flex items-center px-14 py-16 max-[760px]:px-0 max-[760px]:py-12">
        <div className="mx-auto w-full max-w-[410px]">
          <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
            03 / YOUR ACCOUNT
          </p>
          <h1 className="mb-2 text-4xl tracking-[-1.5px]">
            {mode === "login"
              ? "Welcome back."
              : mode === "register"
                ? "Join the orbit."
                : "Find your account."}
          </h1>
          <p className="mb-8 text-sm leading-7 text-neutral-400">
            {mode === "login"
              ? "Continue exploring with the astronomy community."
              : mode === "register"
                ? "Create your profile and share the universe from your perspective."
                : "Enter your account email twice and we'll send you a secure reset link."}
          </p>

          {mode !== "reset" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex items-center justify-center gap-3 border border-neutral-600 px-4 py-3 text-xs transition hover:bg-neutral-800 disabled:opacity-50"
                  disabled={Boolean(busy)}
                  onClick={() => providerSignIn("google")}
                >
                  <ProviderIcon provider="google" />{" "}
                  {busy === "google" ? "Opening..." : "Google"}
                </button>
                <button
                  className="flex items-center justify-center gap-3 border border-neutral-600 px-4 py-3 text-xs transition hover:bg-neutral-800 disabled:opacity-50"
                  disabled={Boolean(busy)}
                  onClick={() => providerSignIn("apple")}
                >
                  <ProviderIcon provider="apple" />{" "}
                  {busy === "apple" ? "Opening..." : "Apple"}
                </button>
              </div>

              <div className="my-7 flex items-center gap-4 font-mono text-[8px] text-neutral-500 before:h-px before:flex-1 before:bg-neutral-800 after:h-px after:flex-1 after:bg-neutral-800">
                OR EMAIL
              </div>
            </>
          )}

          <form className="grid gap-4" onSubmit={submit}>
            {mode === "register" && (
              <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
                DISPLAY NAME
                <input
                  className={inputClass}
                  name="name"
                  value={form.name}
                  onChange={update}
                  autoComplete="name"
                  minLength="2"
                  maxLength="50"
                  required
                />
              </label>
            )}
            <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
              {mode === "reset" ? "ACCOUNT EMAIL" : "EMAIL"}
              <input
                className={inputClass}
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                autoComplete="email"
                required
              />
            </label>
            {mode === "reset" && (
              <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
                CONFIRM EMAIL
                <input
                  className={inputClass}
                  type="email"
                  name="confirmEmail"
                  value={form.confirmEmail}
                  onChange={update}
                  autoComplete="email"
                  required
                />
              </label>
            )}
            {mode !== "reset" && (
              <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
                PASSWORD
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={update}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength="6"
                  required
                />
              </label>
            )}
            {mode === "register" && (
              <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
                CONFIRM PASSWORD
                <input
                  className={inputClass}
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={update}
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
              </label>
            )}

            {error && (
              <p
                role="alert"
                className="border border-red-900 bg-red-950/30 px-4 py-3 text-xs leading-5 text-red-300"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="border border-neutral-700 px-4 py-3 text-xs leading-5 text-neutral-300"
              >
                {notice}
              </p>
            )}

            <button
              className="mt-1 flex min-h-12 items-center justify-between bg-neutral-100 px-5 font-mono text-[10px] text-neutral-950 uppercase transition hover:bg-neutral-300 disabled:opacity-50"
              disabled={Boolean(busy)}
              type="submit"
            >
              {busy === "email"
                ? "Please wait..."
                : busy === "reset"
                  ? "Sending..."
                : mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : "Send reset link"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 font-mono text-[9px] text-neutral-400">
            {mode === "reset" ? (
              <button
                className="hover:text-white disabled:opacity-50"
                disabled={Boolean(busy)}
                onClick={() => changeMode("login")}
              >
                Back to sign in
              </button>
            ) : (
              <>
                <button
                  className="hover:text-white"
                  onClick={() =>
                    changeMode(mode === "login" ? "register" : "login")
                  }
                >
                  {mode === "login"
                    ? "Create an account"
                    : "I already have an account"}
                </button>
                {mode === "login" && (
                  <button
                    className="hover:text-white disabled:opacity-50"
                    disabled={Boolean(busy)}
                    onClick={() => changeMode("reset")}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
