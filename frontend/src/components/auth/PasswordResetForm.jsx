import { useEffect, useState } from "react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../../config/firebase";

const inputClass =
  "w-full border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-300";

function resetError(error) {
  const messages = {
    "auth/expired-action-code":
      "This reset link has expired. Request a new one from the sign-in page.",
    "auth/invalid-action-code":
      "This reset link is invalid or has already been used.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "The account connected to this link no longer exists.",
    "auth/weak-password": "Use a password with at least 6 characters.",
  };

  return (
    messages[error?.code] ||
    error?.message ||
    "We could not reset your password. Please request a new link."
  );
}

export default function PasswordResetForm() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const code = searchParams.get("oobCode");
  const [status, setStatus] = useState("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyLink() {
      if (mode !== "resetPassword" || !code) {
        setError("This password reset link is incomplete or invalid.");
        setStatus("invalid");
        return;
      }

      try {
        const accountEmail = await verifyPasswordResetCode(auth, code);
        if (!active) return;
        setEmail(accountEmail);
        setStatus("ready");
      } catch (verificationError) {
        if (!active) return;
        setError(resetError(verificationError));
        setStatus("invalid");
      }
    }

    verifyLink();
    return () => {
      active = false;
    };
  }, [code, mode]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    setStatus("saving");
    try {
      await confirmPasswordReset(auth, code, password);
      setPassword("");
      setConfirm("");
      setStatus("success");
    } catch (resetFailure) {
      setError(resetError(resetFailure));
      setStatus("ready");
    }
  }

  if (status === "checking") {
    return (
      <div className="py-12 text-center" role="status">
        <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-500">
          VERIFYING SECURE LINK...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="py-4">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
          PASSWORD / UPDATED
        </p>
        <h1 className="mb-3 text-4xl tracking-[-1.5px]">
          Your password is ready.
        </h1>
        <p className="mb-8 text-sm leading-7 text-neutral-400">
          Your Astrovia password has been changed. You can now sign in with
          your new password.
        </p>
        <Link
          className="flex min-h-12 items-center justify-between bg-neutral-100 px-5 font-mono text-[10px] text-neutral-950 uppercase transition hover:bg-neutral-300"
          to="/login"
        >
          Continue to sign in <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="py-4">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-red-300">
          PASSWORD LINK / INTERRUPTED
        </p>
        <h1 className="mb-3 text-4xl tracking-[-1.5px]">
          Request a new signal.
        </h1>
        <p className="mb-8 text-sm leading-7 text-neutral-400" role="alert">
          {error}
        </p>
        <Link
          className="flex min-h-12 items-center justify-between border border-neutral-500 px-5 font-mono text-[10px] uppercase transition hover:bg-neutral-100 hover:text-neutral-950"
          to="/login"
        >
          Return to sign in <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
        SECURITY / NEW PASSWORD
      </p>
      <h1 className="mb-2 text-4xl tracking-[-1.5px]">Set a new password.</h1>
      <p className="mb-8 text-sm leading-7 text-neutral-400">
        Choose a new password for <span className="text-neutral-200">{email}</span>.
      </p>

      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          NEW PASSWORD
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
        </label>
        <label className="grid gap-2 font-mono text-[9px] tracking-[1px] text-neutral-400">
          CONFIRM NEW PASSWORD
          <input
            className={inputClass}
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
        </label>

        {error && (
          <p
            className="border border-red-900 bg-red-950/30 px-4 py-3 text-xs leading-5 text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="mt-1 flex min-h-12 items-center justify-between bg-neutral-100 px-5 font-mono text-[10px] text-neutral-950 uppercase transition hover:bg-neutral-300 disabled:cursor-wait disabled:opacity-50"
          disabled={status === "saving"}
          type="submit"
        >
          {status === "saving" ? "Updating..." : "Update password"}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
