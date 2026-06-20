"use client";

import SchedulingSlotPicker from "@/components/Intake/SchedulingSlotPicker";
import {
  buildBookingPageHref,
  buildBookingUrlWithPrefill,
  hasBooking,
} from "@/config/bookings";
import { buildPublicIntakeHref } from "@/config/carePaths";
import { careCoordinator } from "@/content/site";
import { getOrCreateGuestSessionId } from "@/lib/auth/guestSession";
import { fetchSchedulingStatus } from "@/lib/api/schedulingClient";
import type { ConsultBooking } from "@/lib/scheduling/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readBookingPrefill = () => {
  if (typeof window === "undefined") {
    return {
      name: "",
      email: "",
      phone: "",
      conversationSessionId: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    name: params.get("name")?.trim() ?? "",
    email: params.get("email")?.trim() ?? "",
    phone: params.get("phone")?.trim() ?? "",
    conversationSessionId: params.get("session")?.trim() ?? "",
  };
};

const IntroCallBookingPage = () => {
  const prefill = useMemo(() => readBookingPrefill(), []);
  const [name, setName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [liveSchedulingEnabled, setLiveSchedulingEnabled] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConsultBooking | null>(
    null
  );

  useEffect(() => {
    getOrCreateGuestSessionId();
    void fetchSchedulingStatus().then((status) => {
      setLiveSchedulingEnabled(status.enabled);
    });
  }, []);

  const attendee = {
    name: name.trim(),
    email: email.trim(),
    phone: prefill.phone || undefined,
  };
  const hasValidContact =
    attendee.name.length > 0 && EMAIL_RE.test(attendee.email);

  const handleBookingConfirmed = (booking: ConsultBooking) => {
    setConfirmedBooking(booking);
    toast.success("Your introductory call is booked.");
  };

  return (
    <div className="floating-header-offset mx-auto flex min-h-[70vh] w-full max-w-xl flex-col bg-gradient-to-b from-nurture-cream via-white to-nurture-cream/50 px-4 pb-10 sm:pb-14">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nurture-sage-dark">
          The Nesting Place
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-nurture-charcoal">
          Book your introductory call
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/70">
          Pick an open time below. We&apos;ll send a calendar invite to your
          email so you can connect with our care team.
        </p>
      </div>

      {confirmedBooking ? (
        <div className="mt-8 rounded-2xl border border-nurture-sage/25 bg-nurture-sage/5 p-5">
          <p className="text-sm font-medium text-nurture-charcoal">
            Introductory call confirmed
          </p>
          <p className="mt-2 text-sm text-nurture-charcoal/75">
            {new Date(confirmedBooking.start).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZone: confirmedBooking.timezone,
            })}
          </p>
          <p className="mt-2 text-xs text-nurture-charcoal/60">
            Check {confirmedBooking.attendeeEmail} for your calendar invite.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {confirmedBooking.htmlLink ? (
              <a
                href={confirmedBooking.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
              >
                Add to Google Calendar
              </a>
            ) : null}
            <Link
              href={buildPublicIntakeHref()}
              className="text-xs font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
            >
              Chat with our concierge
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-nurture-sage/20 bg-white/90 p-5">
            <label className="block text-sm font-medium text-nurture-charcoal">
              Your name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-2 w-full rounded-xl border border-nurture-sage/30 px-4 py-3 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                placeholder="Full name"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-nurture-charcoal">
              Email for your calendar invite
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-nurture-sage/30 px-4 py-3 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                placeholder="you@example.com"
              />
            </label>
          </div>

          {hasValidContact && liveSchedulingEnabled ? (
            <SchedulingSlotPicker
              conversationSessionId={prefill.conversationSessionId || undefined}
              attendee={attendee}
              onBooked={handleBookingConfirmed}
            />
          ) : null}

          {hasValidContact && !liveSchedulingEnabled && hasBooking() ? (
            <div className="rounded-2xl border border-nurture-sage/20 bg-white/90 p-5 text-center">
              <p className="text-sm text-nurture-charcoal/75">
                Live slots are unavailable right now. Open our booking calendar
                to choose a time.
              </p>
              <a
                href={
                  buildBookingUrlWithPrefill({
                    name: attendee.name,
                    email: attendee.email,
                  }) ?? buildBookingPageHref()
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Open booking calendar
              </a>
            </div>
          ) : null}

          {!hasValidContact ? (
            <p className="text-center text-xs text-nurture-charcoal/60">
              Enter your name and email to see open times.
            </p>
          ) : null}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-nurture-charcoal/55">
        Questions first?{" "}
        <Link
          href={buildPublicIntakeHref()}
          className="font-medium text-nurture-sage-dark underline-offset-2 hover:underline"
        >
          {careCoordinator.intake.title}
        </Link>
      </p>
    </div>
  );
};

export default IntroCallBookingPage;
