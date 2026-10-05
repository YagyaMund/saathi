"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start px-4 py-20">
      <p className="text-sm tracking-wide text-copper uppercase">Something broke</p>
      <h1 className="mt-3 font-heading text-4xl">The page did not finish.</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {error.message || "Try the page again. If a database URL is set, confirm it can be reached."}
      </p>
      <Button type="button" className="mt-6 h-10 px-4" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
