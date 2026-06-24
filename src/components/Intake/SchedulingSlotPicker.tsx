"use client";

import {
  bookSchedulingSlot,
  fetchSchedulingAvailability,
} from "@/lib/api/schedulingClient";
import {
  trackCallBooking,
  type CallBookingAnalytics,
} from "@/lib/analytics/track";
import type { ConsultBooking, SchedulingSlot } from "@/lib/scheduling/types";
import { useCallback, useEffect, useState } from "react";

interface SchedulingSlotPickerProps {
  conversationSessionId?: string;
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
  onBooked: (booking: ConsultBooking) => void;
  analyticsBookingSource?: CallBookingAnalytics["source"];
}

const SchedulingSlotPicker = ({
  conversationSessionId,
  attendee,
  onBooked,
  analyticsBookingSource,
}: SchedulingSlotPickerProps) => {
  const [slots, setSlots] = useState<SchedulingSlot[]>([]);
  const [timezone, setTimezone] = useState("America/New_York");
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const availability = await fetchSchedulingAvailability();
      if (!availability) {
        setSlots([]);
        setError("Live scheduling is not available right now.");
        return;
      }
      setTimezone(availability.timezone);
      setSlots(availability.slots);
      if (availability.slots.length === 0) {
        setError("No open times in the next two weeks. Try the booking page below.");
      }
    } catch (loadError) {
      setSlots([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load available times"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleBook = async (slot: SchedulingSlot) => {
    setBookingSlot(slot.start);
    setError(null);
    try {
      const booking = await bookSchedulingSlot({
        slotStart: slot.start,
        conversationSessionId,
        attendee,
        idempotencyKey: `${conversationSessionId ?? attendee.email}:${slot.start}`,
      });
      if (analyticsBookingSource) {
        trackCallBooking({ source: analyticsBookingSource });
      }
      onBooked(booking);
    } catch (bookError) {
      setError(
        bookError instanceof Error
          ? bookError.message
          : "That time could not be booked"
      );
    } finally {
      setBookingSlot(null);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-nurture-sage/20 bg-white/95 p-4">
      <p className="text-sm font-medium text-nurture-charcoal">
        Pick an open introductory call time
      </p>
      <p className="mt-1 text-xs text-nurture-charcoal/60">
        These slots are live from our Google Calendar ({timezone}).
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-nurture-charcoal/60">Loading open times…</p>
      ) : null}

      {!loading && slots.length > 0 ? (
        <div className="mt-4 max-h-40 overflow-y-auto overscroll-y-contain">
          <div className="flex flex-wrap gap-2 pr-1">
          {slots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              disabled={Boolean(bookingSlot)}
              onClick={() => void handleBook(slot)}
              className="rounded-full border border-nurture-sage/30 px-3 py-2 text-xs font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-50"
            >
              {bookingSlot === slot.start ? "Booking…" : slot.label}
            </button>
          ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-amber-800">{error}</p>
      ) : null}

      {!loading ? (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => {
            if (refreshing) return;
            setRefreshing(true);
            void loadSlots().finally(() => setRefreshing(false));
          }}
          className="mt-3 text-xs font-medium text-nurture-sage-dark underline-offset-2 hover:underline disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh times"}
        </button>
      ) : null}
    </div>
  );
};

export default SchedulingSlotPicker;
