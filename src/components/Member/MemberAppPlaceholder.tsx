"use client";

import type { MemberApp } from "@/config/memberApps";
import { MEMBER_APPS_HREF } from "@/config/memberApps";
import Link from "next/link";
import { MemberAppIcon } from "./MemberAppIcon";

interface MemberAppPlaceholderProps {
  app: MemberApp;
}

export function MemberAppPlaceholder({ app }: MemberAppPlaceholderProps) {
  const features = app.plannedFeatures ?? [
    "Personalized for your maternal stage",
    "Integrated with your support coordinator",
    "Notifications when new features launch",
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
          <MemberAppIcon icon={app.icon} className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
            Coming soon
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal">
            {app.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
            {app.description}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-nurture-sage/15 bg-nurture-cream/40 p-6">
        <h3 className="text-sm font-semibold text-nurture-charcoal">
          Planned for this app
        </h3>
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex gap-2 text-sm text-nurture-charcoal/75"
            >
              <span className="text-nurture-sage-dark" aria-hidden>
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm text-nurture-charcoal/60">
        We&apos;re building this so moms can find everything relevant in one
        place. Your coordinator can still help with questions in the meantime.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/apps/dashboard"
          className="rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Back to support dashboard
        </Link>
        <Link
          href={MEMBER_APPS_HREF}
          className="rounded-full border border-nurture-sage/30 px-5 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          All apps
        </Link>
        <Link
          href="/for-moms"
          className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
        >
          Browse resources
        </Link>
      </div>
    </div>
  );
}
