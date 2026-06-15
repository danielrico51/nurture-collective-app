import {
  formatEventDate,
  formatEventSchedule,
  kindLabel,
} from "@/lib/events/format";
import type { ProviderClassRoster } from "@/lib/classRegistrations/providerRoster";
import type {
  ClassRegistrationPaymentStatus,
  ClassRegistrationStatus,
} from "@/types/classRegistration";

interface ProviderClassRosterProps {
  roster: ProviderClassRoster;
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

const ProviderClassRoster = ({ roster }: ProviderClassRosterProps) => {
  const { event, availability, registrations, expiresAt } = roster;
  const schedule = formatEventSchedule(event.eventDate, event.startTime);

  return (
    <div className="space-y-6">
      <header className="border-b border-nurture-sage/15 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
          Instructor roster
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-nurture-charcoal">
          {event.title}
        </h1>
        <p className="mt-2 text-sm text-nurture-charcoal/70">
          {kindLabel(event.kind)} · {schedule}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.instructorName ? (
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Instructor: {event.instructorName}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-nurture-charcoal/60">
          {availability.confirmedCount} confirmed
          {availability.capacity !== null
            ? ` · ${availability.spotsRemaining ?? 0} spots left of ${availability.capacity}`
            : ""}
          {availability.waitlistCount > 0
            ? ` · ${availability.waitlistCount} waitlisted`
            : ""}
        </p>
        <p className="mt-2 text-xs text-nurture-charcoal/50">
          Read-only roster · link expires {formatEventDate(expiresAt.slice(0, 10))}
        </p>
      </header>

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
                <th className="px-3 py-2 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nurture-sage/10">
              {registrations.map((registration) => (
                <tr key={`${registration.registrantEmail}-${registration.registeredAt}`}>
                  <td className="px-3 py-2 font-medium text-nurture-charcoal">
                    {registration.registrantName}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {registration.registrantEmail}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {registration.registrantPhone ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {STATUS_LABELS[registration.status]}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {PAYMENT_STATUS_LABELS[registration.paymentStatus]}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {new Date(registration.registeredAt).toLocaleString()}
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

export default ProviderClassRoster;
