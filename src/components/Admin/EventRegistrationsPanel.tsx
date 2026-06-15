"use client";

import {
  fetchAdminEventRegistrations,
  fetchAdminProviderRosterLink,
  updateAdminRegistration,
} from "@/lib/api/classRegistrationsClient";
import type {
  ClassAvailability,
  ClassRegistration,
  ClassRegistrationPaymentStatus,
  ClassRegistrationStatus,
} from "@/types/classRegistration";
import { formatPaymentStatusLabel } from "@/lib/classRegistrations/payments";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface EventRegistrationsPanelProps {
  eventSlug: string;
  instructorEmail?: string;
}

const STATUS_LABELS: Record<ClassRegistrationStatus, string> = {
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<ClassRegistrationPaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
};

const SOURCE_LABELS: Record<ClassRegistration["source"], string> = {
  website: "Website",
  google_business: "Google Business",
  admin_manual: "Admin",
};

const EventRegistrationsPanel = ({
  eventSlug,
  instructorEmail,
}: EventRegistrationsPanelProps) => {
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [availability, setAvailability] = useState<ClassAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [providerLink, setProviderLink] = useState<string | null>(null);
  const [providerLinkExpiresAt, setProviderLinkExpiresAt] = useState<string | null>(
    null
  );
  const [providerLinkLoading, setProviderLinkLoading] = useState(false);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminEventRegistrations(eventSlug);
      setRegistrations(data.registrations);
      setAvailability(data.availability);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load registrations"
      );
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    if (!instructorEmail?.trim()) {
      setProviderLink(null);
      setProviderLinkExpiresAt(null);
      return;
    }

    let cancelled = false;
    setProviderLinkLoading(true);
    void fetchAdminProviderRosterLink(eventSlug)
      .then((data) => {
        if (cancelled) return;
        setProviderLink(data.url);
        setProviderLinkExpiresAt(data.expiresAt);
      })
      .catch(() => {
        if (cancelled) return;
        setProviderLink(null);
        setProviderLinkExpiresAt(null);
      })
      .finally(() => {
        if (!cancelled) setProviderLinkLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventSlug, instructorEmail]);

  const copyProviderLink = async () => {
    if (!providerLink) return;
    try {
      await navigator.clipboard.writeText(providerLink);
      toast.success("Instructor roster link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleStatusChange = async (
    registration: ClassRegistration,
    status: ClassRegistrationStatus
  ) => {
    if (status === registration.status) return;
    setUpdatingId(registration.id);
    try {
      const { registration: updated } = await updateAdminRegistration(
        registration.id,
        { status }
      );
      setRegistrations((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      await loadRegistrations();
      toast.success("Registration updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update registration"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (
    registration: ClassRegistration,
    paymentStatus: ClassRegistrationPaymentStatus
  ) => {
    if (paymentStatus === registration.paymentStatus) return;
    setUpdatingId(registration.id);
    try {
      const { registration: updated } = await updateAdminRegistration(
        registration.id,
        { paymentStatus }
      );
      setRegistrations((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      toast.success("Payment status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update payment"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading registrations…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Registrations
          </h3>
          {availability ? (
            <p className="mt-1 text-sm text-nurture-charcoal/65">
              {availability.confirmedCount} confirmed
              {availability.capacity !== null
                ? ` · ${availability.spotsRemaining ?? 0} spots left of ${availability.capacity}`
                : ""}
              {availability.waitlistCount > 0
                ? ` · ${availability.waitlistCount} waitlisted`
                : ""}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void loadRegistrations()}
          className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Refresh
        </button>
      </div>

      {instructorEmail?.trim() ? (
        <div className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 px-4 py-3 text-sm text-nurture-charcoal/75">
          <p className="font-medium text-nurture-charcoal">
            Instructor roster link
          </p>
          <p className="mt-1 text-xs text-nurture-charcoal/60">
            Read-only magic link for {instructorEmail}
            {providerLinkExpiresAt
              ? ` · expires ${new Date(providerLinkExpiresAt).toLocaleDateString()}`
              : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyProviderLink()}
              disabled={!providerLink || providerLinkLoading}
              className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
            >
              {providerLinkLoading ? "Loading link…" : "Copy instructor link"}
            </button>
            {providerLink ? (
              <a
                href={providerLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-nurture-sage-dark hover:underline"
              >
                Preview roster →
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-xs text-nurture-charcoal/55">
          Add an instructor email to enable roster notifications and a magic-link
          roster page.
        </p>
      )}

      {registrations.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">No registrations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nurture-sage/15">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-nurture-cream/50 text-xs uppercase tracking-wide text-nurture-charcoal/55">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Payment</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Confirm</th>
                <th className="px-3 py-2 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nurture-sage/10">
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td className="px-3 py-2 font-medium text-nurture-charcoal">
                    {registration.registrantName}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {registration.registrantEmail}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {registration.registrantPhone ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={registration.status}
                      disabled={updatingId === registration.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          registration,
                          event.target.value as ClassRegistrationStatus
                        )
                      }
                      className="rounded-lg border border-nurture-sage/25 px-2 py-1 text-xs"
                    >
                      {(Object.keys(STATUS_LABELS) as ClassRegistrationStatus[]).map(
                        (status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {registration.amountCents > 0 ? (
                      <select
                        value={registration.paymentStatus}
                        disabled={updatingId === registration.id}
                        onChange={(event) =>
                          void handlePaymentStatusChange(
                            registration,
                            event.target.value as ClassRegistrationPaymentStatus
                          )
                        }
                        className="rounded-lg border border-nurture-sage/25 px-2 py-1 text-xs"
                      >
                        {(
                          Object.keys(
                            PAYMENT_STATUS_LABELS
                          ) as ClassRegistrationPaymentStatus[]
                        ).map((status) => (
                          <option key={status} value={status}>
                            {PAYMENT_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-nurture-charcoal/50">
                        {formatPaymentStatusLabel(registration)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {SOURCE_LABELS[registration.source]}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {registration.emailDelivery?.registrant
                      ? "Sent"
                      : registration.emailDelivery?.errors?.length
                        ? "Failed"
                        : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {new Date(registration.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventRegistrationsPanel;
