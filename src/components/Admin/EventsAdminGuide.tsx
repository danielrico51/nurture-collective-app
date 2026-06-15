"use client";

import {
  LISTING_STATUS_LABELS,
  REGISTRATION_MODE_LABELS,
} from "@/lib/events/format";
import Link from "next/link";
import type { ReactNode } from "react";

const GuideSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="space-y-2">
    <h4 className="text-sm font-semibold text-nurture-charcoal">{title}</h4>
    <div className="space-y-2 text-sm leading-relaxed text-nurture-charcoal/75">
      {children}
    </div>
  </section>
);

const EventsAdminGuide = () => (
  <details className="group rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40">
    <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-nurture-charcoal">
            How to use Events & classes
          </p>
          <p className="mt-0.5 text-xs text-nurture-charcoal/60">
            Creating listings, copying past sessions, registration modes, and
            common gotchas
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-nurture-sage-dark group-open:hidden">
          Show guide
        </span>
        <span className="hidden shrink-0 text-xs font-semibold text-nurture-sage-dark group-open:inline">
          Hide guide
        </span>
      </div>
    </summary>

    <div className="space-y-6 border-t border-nurture-sage/15 px-5 py-5">
      <GuideSection title="Create a new listing">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Click <strong>New listing</strong> and fill in the basics: title,
            date, type (class or event), format, and location.
          </li>
          <li>
            Write the <strong>excerpt</strong> (short card blurb) and{" "}
            <strong>details</strong> (full description — separate paragraphs with
            a blank line).
          </li>
          <li>
            Choose how families register (see <em>Registration modes</em> below).
            For paid online classes, set a price and capacity.
          </li>
          <li>
            Set <strong>Publish status</strong> to Draft while you work, then
            Published when ready. Only published listings appear on the public
            site.
          </li>
          <li>
            Click <strong>Create</strong> or <strong>Save</strong>. Use{" "}
            <strong>View live →</strong> (top right) to preview the public page
            after publishing.
          </li>
        </ol>
      </GuideSection>

      <GuideSection title="Copy & reopen a past session">
        <p>
          For a class you&apos;ve run before, open the old listing →{" "}
          <strong>Details</strong> → <strong>Copy & reopen session</strong>. This
          creates a <strong>new draft</strong> with the same description, price,
          instructor, and FAQ, but:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Fresh event date (about two weeks out — change it before saving)</li>
          <li>Listing status reset to Upcoming</li>
          <li>Publish status reset to Draft</li>
          <li>No Google Calendar link (sync again from the Calendar tab)</li>
          <li>No registrations carried over — each session is separate</li>
        </ul>
        <p>
          Update the date and any details, then <strong>Create</strong>. If the
          slug already exists, the system adds a short suffix automatically.
        </p>
      </GuideSection>

      <GuideSection title="Class vs event">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Classes</strong> default to online registration and can
            appear on{" "}
            <Link
              href="/book/classes"
              target="_blank"
              className="font-medium text-nurture-sage-dark hover:underline"
            >
              /book/classes
            </Link>{" "}
            when published with open registration.
          </li>
          <li>
            <strong>Events</strong> (workshops, gatherings) default to{" "}
            <em>contact to register</em> unless you switch registration mode.
            They show on the main catalog but not on /book/classes.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Publish status vs listing status">
        <p>
          <strong>Publish status</strong> controls visibility: Draft = admin only;
          Published = live on{" "}
          <Link
            href="/events-and-classes"
            target="_blank"
            className="font-medium text-nurture-sage-dark hover:underline"
          >
            Events & classes
          </Link>
          .
        </p>
        <p>
          <strong>Listing status</strong> is the badge families see and affects
          registration:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {(Object.keys(LISTING_STATUS_LABELS) as Array<
            keyof typeof LISTING_STATUS_LABELS
          >).map((key) => (
            <li key={key}>
              <strong>{LISTING_STATUS_LABELS[key]}</strong>
              {key === "completed"
                ? " — closes online registration; use when the session is done"
                : key === "contact"
                  ? " — register button sends families to Contact"
                  : key === "upcoming"
                    ? " — standard open listing"
                    : " — session is in progress"}
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection title="Registration modes">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>{REGISTRATION_MODE_LABELS.online}</strong> — families use the
            on-site form at <code className="text-xs">/register</code> with
            optional Stripe, Venmo, or pay-later. Enables the Registrations,
            Payments, and instructor roster tools.
          </li>
          <li>
            <strong>{REGISTRATION_MODE_LABELS.contact}</strong> — the main button
            goes to the Contact page (&quot;Register or inquire&quot;). Good for
            events without fixed pricing or when you want a conversation first.
          </li>
          <li>
            <strong>{REGISTRATION_MODE_LABELS.external}</strong> — send families
            to an external URL (Eventbrite, Google Form, etc.). Paste a full{" "}
            <code className="text-xs">https://…</code> link or a site path like{" "}
            <code className="text-xs">/contact</code>.
          </li>
        </ul>
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          <strong>Common surprise:</strong> events default to contact registration.
          If you want online signup for a workshop, change registration mode to{" "}
          <em>Online registration</em> and save.
        </p>
      </GuideSection>

      <GuideSection title="Tabs after you save">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Registrations</strong> — roster of sign-ups; confirm or
            waitlist people. Requires online registration and a saved listing.
          </li>
          <li>
            <strong>Payments</strong> — payment status for paid registrations
            (Stripe, Venmo, pay-later).
          </li>
          <li>
            <strong>Calendar</strong> — sync the session to the classes Google
            Calendar. Set start time and duration on Details first.
          </li>
          <li>
            <strong>Instructor roster link</strong> (on Registrations) — a
            read-only magic link for the instructor. Requires instructor email on
            Details. Copy or preview from admin; link expires about a week after
            the class ends.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Find listings in a long list">
        <p>
          Use the sidebar filters: search by title or instructor, filter by
          published/draft, active vs past sessions, class vs event, and sort
          oldest/newest. Mark finished sessions as <em>Completed</em> so they
          move out of active filters.
        </p>
      </GuideSection>

      <GuideSection title="Settings tab">
        <p>
          Shows whether emails, Stripe, Venmo, and calendar sync are configured
          in the environment. Payment and email features need those env vars on
          the deployed branch — contact your developer if something shows Off
          unexpectedly.
        </p>
      </GuideSection>

      <GuideSection title="Dev vs production">
        <p>
          The <strong>dev</strong> site uses separate event and registration data
          from the live site. A listing published on dev is not on{" "}
          <code className="text-xs">www.nesting-place.com</code> until you create
          or publish it on production. Instructor roster preview links open on
          whichever site you are using.
        </p>
      </GuideSection>
    </div>
  </details>
);

export default EventsAdminGuide;
