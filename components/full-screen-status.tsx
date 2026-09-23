"use client";

import { LoaderCircle } from "lucide-react";

export function FullScreenStatus({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {message}
      </p>
    </div>
  );
}
