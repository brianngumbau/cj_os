"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import { FullScreenStatus } from "./full-screen-status";

/**
 * Client-side route guard. Auth state lives only in the browser (Firebase
 * client SDK), so the redirect has to happen after hydration.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  if (status !== "signed-in") {
    return (
      <FullScreenStatus
        message={status === "loading" ? "Verifying session" : "Redirecting to sign-in"}
      />
    );
  }

  return <>{children}</>;
}
