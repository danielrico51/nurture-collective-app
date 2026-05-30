import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import { brands } from "@/content/site";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlights?: string[];
  /** Split = marketing column + form (sign-in). Centered = form only (sign-up). */
  layout?: "split" | "centered";
  children: ReactNode;
  footer?: ReactNode;
}

const defaultHighlights = [
  "Access your member dashboard",
  "View resources and updates",
  "Connect with the collective",
];

export function AuthPageShell({
  eyebrow = "Member portal",
  title,
  subtitle,
  highlights = defaultHighlights,
  layout = "split",
  children,
  footer,
}: AuthPageShellProps) {
  if (layout === "centered") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-nurture-cream via-white to-nurture-sage/20 px-4 py-8 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-nurture-sage/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-nurture-blush/35 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-md">
          <div className="mb-5 text-center">
            <NestingPlaceLogo
              variant="auth"
              linked={false}
              className="mx-auto max-h-12 w-auto sm:max-h-14"
            />
            <p className="mt-2 font-serif text-base font-semibold text-nurture-sage-dark">
              {brands.nestingPlace.name}
            </p>
            <h1 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-relaxed text-nurture-charcoal/65">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="nurture-authenticator nurture-authenticator--compact nurture-authenticator--signup-only min-w-0 w-full rounded-2xl border border-nurture-sage/20 bg-white/95 p-4 shadow-auth backdrop-blur-sm sm:p-5">
            {children}
            {footer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-nurture-cream via-white to-nurture-sage/20 px-4 py-10 sm:py-14 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-nurture-sage/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-nurture-blush/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-nurture-sage/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14 xl:gap-20">
          <div className="hidden lg:block">
            <NestingPlaceLogo variant="auth" linked={false} className="mx-auto max-h-16 w-auto sm:max-h-[4.5rem]" />
            <p className="mt-3 font-serif text-lg font-semibold text-nurture-sage-dark">
              {brands.nestingPlace.name}
            </p>
            <p className="mt-1 text-sm text-nurture-charcoal/60">
              {brands.nestingPlace.byline}
            </p>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-nurture-sage-dark">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal xl:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 max-w-md text-lg leading-relaxed text-nurture-charcoal/70">
                {subtitle}
              </p>
            ) : null}
            <ul className="mt-10 space-y-3">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-nurture-charcoal/75"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nurture-sage/20 text-nurture-sage-dark">
                    <svg
                      aria-hidden
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto min-w-0 w-full max-w-md lg:max-w-none">
            <div className="mb-6 text-center lg:hidden">
              <NestingPlaceLogo variant="auth" linked={false} className="mx-auto max-h-16 w-auto sm:max-h-[4.5rem]" />
              <p className="mt-3 font-serif text-lg font-semibold text-nurture-sage-dark">
                {brands.nestingPlace.name}
              </p>
              <p className="mt-1 text-sm text-nurture-charcoal/60">
                {brands.nestingPlace.byline}
              </p>
              <h1 className="mt-4 font-serif text-3xl font-semibold text-nurture-charcoal">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm text-nurture-charcoal/65">{subtitle}</p>
              ) : null}
            </div>

            <div className="nurture-authenticator min-w-0 w-full overflow-hidden rounded-3xl border border-nurture-sage/20 bg-white/95 p-6 shadow-auth backdrop-blur-sm sm:p-8">
              {children}
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
