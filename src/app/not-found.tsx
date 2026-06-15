import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-nurture-charcoal/70">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
      >
        Go home
      </Link>
    </main>
  );
}
