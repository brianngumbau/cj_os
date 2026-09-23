"use client";

import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "./firebase";
import type { UserProfile } from "./types";
import { subscribeToUserProfile } from "./users";

type AuthStatus = "loading" | "signed-in" | "signed-out";

type AuthContextValue = {
  /** The Firebase Auth user, or `null` when signed out. */
  user: User | null;
  /** The matching `users` document. `null` until an admin provisions one. */
  profile: UserProfile | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOutOfCjOs: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Turns a Firebase auth error code into something an operator can act on. */
export function describeAuthError(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";

  switch (code) {
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/user-disabled":
      return "This account is disabled. Contact an administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, then try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in the Firebase console.";
    default:
      return code ? `Sign-in failed (${code}).` : "Sign-in failed. Try again.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setStatus(nextUser ? "signed-in" : "signed-out");
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    // A missing or unreadable profile is not fatal — the ledger falls back to
    // the account email, so sign-in still works before admins fill `users`.
    return subscribeToUserProfile(
      user.uid,
      (nextProfile) => setProfile(nextProfile),
      () => setProfile(null),
    );
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOutOfCjOs = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, status, signIn, signOutOfCjOs }),
    [user, profile, status, signIn, signOutOfCjOs],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return value;
}

/** Best available label for a user: profile name, then email, then a short id. */
export function displayNameFor(
  profile: UserProfile | null | undefined,
  fallbackEmail?: string | null,
  uid?: string,
): string {
  if (profile?.displayName) return profile.displayName;
  if (fallbackEmail) return fallbackEmail;
  return uid ? `${uid.slice(0, 6)}…` : "Unassigned";
}
