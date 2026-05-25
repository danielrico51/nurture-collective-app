"use client";

import { ADMIN_APPS } from "@/config/adminApps";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminAppIcon } from "./AdminAppIcon";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const isHub = pathname === "/admin";

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-nurture-sage/20 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-nurture-sage via-nurture-sage-dark to-nurture-charcoal px-6 py-8 text-white sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Admin workspace
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                {isHub ? "Apps" : "Admin"}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                {isHub
                  ? "Internal tools for the admin team. More apps can be added here over time."
                  : "Manage team operations from your admin tools."}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              ← Member dashboard
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <aside className="border-b border-nurture-sage/15 bg-nurture-cream/30 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
            <nav
              aria-label="Admin apps"
              className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4"
            >
              <Link
                href="/admin"
                className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:px-4 ${
                  pathname === "/admin"
                    ? "bg-nurture-sage text-white shadow-sm"
                    : "text-nurture-charcoal/75 hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
                }`}
              >
                All apps
              </Link>
              {ADMIN_APPS.map((app) => {
                const active = pathname === app.href;
                const isAvailable = app.status === "available";

                if (!isAvailable) {
                  return (
                    <div
                      key={app.id}
                      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-nurture-charcoal/35 lg:px-4"
                      title="Coming soon"
                    >
                      <AdminAppIcon icon={app.icon} className="h-4 w-4" />
                      {app.title}
                    </div>
                  );
                }

                return (
                  <Link
                    key={app.id}
                    href={app.href}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:px-4 ${
                      active
                        ? "bg-nurture-sage text-white shadow-sm"
                        : "text-nurture-charcoal/75 hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
                    }`}
                  >
                    <AdminAppIcon icon={app.icon} className="h-4 w-4" />
                    {app.title}
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
