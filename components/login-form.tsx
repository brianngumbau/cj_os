"use client";

import { ArrowRight, LoaderCircle, Lock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { describeAuthError, useAuth } from "@/lib/auth-context";

export function LoginForm() {
  const { status, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // An already-signed-in operator never sees this form.
  useEffect(() => {
    if (status === "signed-in") router.replace("/dashboard");
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (caught) {
      setError(describeAuthError(caught));
      setSubmitting(false);
    }
  }

  const busy = submitting || status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm"
    >
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          CJ Labs
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">CJ OS</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to the commitment ledger.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:ring-2 focus:ring-accent/20"
            placeholder="you@cjlabs.co"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-accent/20"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-blocked/30 bg-blocked-surface px-3 py-2 text-xs text-blocked"
        >
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="size-4" aria-hidden />
        )}
        {submitting ? "Signing in" : "Sign in"}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <Lock className="size-3" aria-hidden />
        Accounts are provisioned by an administrator.
      </p>
    </form>
  );
}
