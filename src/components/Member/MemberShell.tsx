"use client";

import { MEMBER_APPS, MEMBER_APPS_HREF } from "@/config/memberApps";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MemberAppIcon } from "./MemberAppIcon";

interface MemberShellProps {
  children: ReactNode;
  canAccessAdmin?: boolean;
}

export function MemberShell({
  children,
  canAccessAdmin = false,
}: MemberShellProps) {
  const pathname = usePathname();
  const isHub = pathname === MEMBER_APPS_HREF;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-nurture-blush/30 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-nurture-blush via-nurture-sage to-nurture-sage-dark px-6 py-8 text-white sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                Member apps
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                {isHub ? "Your apps" : "Apps"}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                {isHub
                  ? "Everything you need in one place — support, community, and resources built for moms."
                  : "Find relevant information and tools for your journey."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canAccessAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Admin workspace
                </Link>
              ) : null}
              <Link
                href="/account/profile"
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <aside className="border-b border-nurture-sage/15 bg-nurture-cream/30 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
            <nav
              aria-label="Member apps"
              className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4"
            >
              <Link
                href={MEMBER_APPS_HREF}
                className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:px-4 ${
                  pathname === MEMBER_APPS_HREF
                    ? "bg-nurture-sage text-white shadow-sm"
                    : "text-nurture-charcoal/75 hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
                }`}
              >
                All apps
              </Link>
              {MEMBER_APPS.map((app) => {
                const active =
                  pathname === app.href || pathname.startsWith(`${app.href}/`);
                const isAvailable = app.status === "available";

                return (
                  <Link
                    key={app.id}
                    href={app.href}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:px-4 ${
                      active
                        ? "bg-nurture-sage text-white shadow-sm"
                        : "text-nurture-charcoal/75 hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
                    } ${!isAvailable ? "opacity-80" : ""}`}
                  >
                    <MemberAppIcon icon={app.icon} className="h-4 w-4" />
                    <span className="truncate">{app.title}</span>
                    {!isAvailable ? (
                      <span className="ml-auto hidden text-[9px] uppercase tracking-wide text-nurture-charcoal/40 lg:inline">
                        Soon
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
