import { getApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

/**
 * Firebase client configuration for CJ OS.
 *
 * Each value is read as a literal `process.env.NEXT_PUBLIC_*` expression on
 * purpose. Next.js inlines these into the browser bundle at build time and
 * does not inline dynamic lookups such as `process.env[name]` or a
 * destructured `process.env`.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Keys Auth and Firestore cannot start without, paired with their env names. */
const requiredConfig: ReadonlyArray<[keyof FirebaseOptions, string]> = [
  ["apiKey", "NEXT_PUBLIC_FIREBASE_API_KEY"],
  ["authDomain", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  ["appId", "NEXT_PUBLIC_FIREBASE_APP_ID"],
];

const missingConfig = requiredConfig
  .filter(([key]) => !firebaseConfig[key])
  .map(([, envName]) => envName);

if (missingConfig.length > 0) {
  // Without this, a missing value surfaces later as an opaque
  // `auth/invalid-api-key` from deep inside the SDK.
  throw new Error(
    `Firebase is not configured. Missing ${missingConfig.join(", ")} in .env.local. ` +
      "Add the values from the Firebase console (Project settings > Your apps > SDK setup), " +
      "then restart `next dev` — NEXT_PUBLIC_ variables are inlined at build time.",
  );
}

// A value pasted from the console's JS snippet keeps its trailing comma or
// quotes. Auth tolerates that, but Firestore then targets a project that does
// not exist: writes sit in the local cache, never acknowledged, and vanish on
// refresh. Fail here instead.
const malformedConfig = requiredConfig
  .filter(([key]) => /[",'\s]/.test(String(firebaseConfig[key])))
  .map(([, envName]) => envName);

if (malformedConfig.length > 0) {
  throw new Error(
    `Firebase config is malformed. ${malformedConfig.join(", ")} in .env.local ` +
      'contains a stray comma, quote or space — use NAME="value" with nothing after the closing quote, ' +
      "then restart `next dev`.",
  );
}

// `next dev` re-evaluates this module on hot reload, so reuse the existing
// app instead of letting Firebase throw on duplicate initialization.
export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
