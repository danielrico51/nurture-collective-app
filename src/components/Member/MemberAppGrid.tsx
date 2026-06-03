"use client";

import { getMemberAppsForHub } from "@/config/memberApps";
import Link from "next/link";
import { MemberAppIcon } from "./MemberAppIcon";

export function MemberAppGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {getMemberAppsForHub().map((app) => {
        const isAvailable = app.status === "available";

        const card = (
          <div
            className={`flex h-full flex-col rounded-2xl border p-6 transition ${
              isAvailable
                ? "border-nurture-blush/50 bg-white shadow-sm hover:border-nurture-sage/40 hover:shadow-md"
                : "border-nurture-sage/10 bg-nurture-cream/40 opacity-90"
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
                <MemberAppIcon icon={app.icon} />
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
                Preview what&apos;s planned
              </span>
            )}
          </div>
        );

        if (!isAvailable) {
          return (
            <div key={app.id} className="block h-full cursor-default">
              {card}
            </div>
          );
        }

        return (
          <Link key={app.id} href={app.href} className="block h-full">
            {card}
          </Link>
        );
      })}
    </div>
  );
}
