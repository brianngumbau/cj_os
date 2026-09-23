"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";

import { displayNameFor, useAuth } from "@/lib/auth-context";

/**
 * App shell header for signed-in routes: who you are, and the way out.
 *
 * Sign-out deliberately does not redirect. Clearing the Firebase session flips
 * auth state to signed-out, and <AuthGate> is what sends the browser to
 * /login — one redirect rule for the whole app rather than two.
 */
export function AppHeader() {
  const { user, profile, signOutOfCjOs } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutOfCjOs();
    } catch {
      // Sign-out fails only if the network is down. The session is still live,
      // so re-enable the button instead of stranding the operator mid-state.
      setSigningOut(false);
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            CJ Labs
          </span>
          <span className="text-sm font-semibold tracking-tight">CJ OS</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-xs font-medium">
              {displayNameFor(profile, user?.email, user?.uid)}
            </p>
            {profile?.department ? (
              <p className="text-[11px] text-muted">{profile.department}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-3.5" aria-hidden />
            )}
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
