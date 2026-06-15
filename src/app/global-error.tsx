"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-nurture-charcoal/70">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
