"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import { FullScreenStatus } from "./full-screen-status";

/** Sends visitors at `/` to the ledger or to sign-in, once auth state is known. */
export function BootRedirect() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-in") router.replace("/dashboard");
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  return <FullScreenStatus message="Starting CJ OS" />;
}
