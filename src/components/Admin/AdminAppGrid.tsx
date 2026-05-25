"use client";

import { ADMIN_APPS } from "@/config/adminApps";
import Link from "next/link";
import { AdminAppIcon } from "./AdminAppIcon";

export function AdminAppGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {ADMIN_APPS.map((app) => {
        const isAvailable = app.status === "available";

        const card = (
          <div
            className={`flex h-full flex-col rounded-2xl border p-6 transition ${
              isAvailable
                ? "border-nurture-sage/20 bg-white shadow-sm hover:border-nurture-sage/40 hover:shadow-md"
                : "border-nurture-sage/10 bg-nurture-cream/40 opacity-80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isAvailable
                    ? "bg-nurture-sage/15 text-nurture-sage-dark"
                    : "bg-nurture-charcoal/5 text-nurture-charcoal/40"
                }`}
              >
                <AdminAppIcon icon={app.icon} />
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  isAvailable
                    ? "bg-nurture-sage/15 text-nurture-sage-dark"
                    : "bg-nurture-charcoal/5 text-nurture-charcoal/45"
                }`}
              >
                {isAvailable ? "Available" : "Coming soon"}
              </span>
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-nurture-charcoal">
              {app.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-nurture-charcoal/65">
              {app.description}
            </p>
            {isAvailable ? (
              <span className="mt-5 text-sm font-semibold text-nurture-sage-dark">
                Open app →
              </span>
            ) : (
              <span className="mt-5 text-xs text-nurture-charcoal/45">
                Not available yet
              </span>
            )}
          </div>
        );

        if (isAvailable) {
          return (
            <Link key={app.id} href={app.href} className="block h-full">
              {card}
            </Link>
          );
        }

        return (
          <div key={app.id} aria-disabled className="h-full">
            {card}
          </div>
        );
      })}
    </div>
  );
}
