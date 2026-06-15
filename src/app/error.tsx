"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-nurture-charcoal/70">
        Please try again. If the problem continues, refresh the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
      >
        Try again
      </button>
    </main>
  );
}
