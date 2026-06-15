import { toAbsoluteUrl } from "@/config/siteUrl";
import { brands } from "@/content/site";
import { nestingPlaceContactEmail } from "@/config/integrations";
import { formatPaymentStatusLabel } from "@/lib/classRegistrations/payments";
import {
  formatEventDate,
  formatEventPrice,
  formatEventSchedule,
} from "@/lib/events/format";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildScheduleLine = (event: EventItem) =>
  formatEventSchedule(event.eventDate, event.startTime);

const buildLocationLine = (event: EventItem) => {
  const parts: string[] = [event.format];
  if (event.location) parts.push(event.location);
  return parts.join(" · ");
};

export const buildRegistrantConfirmationEmail = (
  event: EventItem,
  registration: ClassRegistration
) => {
  const waitlisted = registration.status === "waitlisted";
  const priceLabel = formatEventPrice(event.priceCents);
  const classUrl = toAbsoluteUrl(`/events-and-classes/${event.slug}`);
  const schedule = buildScheduleLine(event);
  const location = buildLocationLine(event);
  const contact = nestingPlaceContactEmail;
  const phone = brands.nestingPlace.localPhone;

  const subject = waitlisted
    ? `Waitlist confirmation — ${event.title}`
    : `You're registered — ${event.title}`;

  const intro = waitlisted
    ? `You're on the waitlist for ${event.title}. We'll reach out if a spot opens.`
    : `You're registered for ${event.title}.`;

  const text = [
    `Hi ${registration.registrantName},`,
    "",
    intro,
    "",
    `When: ${schedule}`,
    `Where: ${location}`,
    priceLabel ? `Fee: ${priceLabel}` : "",
    "",
    `Class details: ${classUrl}`,
    "",
    waitlisted
      ? "No payment is required while you're on the waitlist."
      : priceLabel
        ? "Payment instructions will follow in a separate message if a fee applies."
        : "",
    "",
    `Questions? Email ${contact} or call ${phone}.`,
    "",
    "With care,",
    brands.nestingPlace.name,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f7f4f1;font-family:Georgia,'Times New Roman',serif;color:#3d3d3d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #d4e4dc;overflow:hidden;">
        <tr>
          <td style="background:#6b8f7a;padding:28px 32px;color:#fff;">
            <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.9;">${escapeHtml(brands.nestingPlace.name)}</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:600;">${waitlisted ? "Waitlist confirmation" : "Registration confirmed"}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${escapeHtml(registration.registrantName)},</p>
            <p style="margin:0 0 20px;line-height:1.6;font-size:15px;">${escapeHtml(intro)}</p>
            <table width="100%" style="background:#f7f4f1;border-radius:12px;margin-bottom:20px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:20px 24px;line-height:1.6;font-size:14px;">
                <p style="margin:0 0 8px;"><strong>${escapeHtml(event.title)}</strong></p>
                <p style="margin:0 0 4px;">${escapeHtml(schedule)}</p>
                <p style="margin:0 0 4px;">${escapeHtml(location)}</p>
                ${priceLabel ? `<p style="margin:0;">Fee: ${escapeHtml(priceLabel)}</p>` : ""}
              </td></tr>
            </table>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
              <a href="${escapeHtml(classUrl)}" style="color:#6b8f7a;">View class details</a>
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#555;">
              Questions? <a href="mailto:${escapeHtml(contact)}" style="color:#6b8f7a;">${escapeHtml(contact)}</a>
              or call <a href="tel:${escapeHtml(brands.nestingPlace.localPhoneE164)}" style="color:#6b8f7a;">${escapeHtml(phone)}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#faf8f6;border-top:1px solid #eee;font-size:12px;color:#888;">
            ${escapeHtml(brands.nestingPlace.name)} · ${escapeHtml(brands.nestingPlace.tagline)}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  return { subject, text, html };
};

export const buildAdminRegistrationAlertEmail = (
  event: EventItem,
  registration: ClassRegistration
) => {
  const priceLabel = formatEventPrice(event.priceCents);
  const adminUrl = toAbsoluteUrl("/admin/events");
  const schedule = buildScheduleLine(event);

  const subject = `New class registration — ${event.title}`;
  const text = [
    `New ${registration.status} registration for ${event.title}`,
    "",
    `Name: ${registration.registrantName}`,
    `Email: ${registration.registrantEmail}`,
    registration.registrantPhone ? `Phone: ${registration.registrantPhone}` : "",
    `Status: ${registration.status}`,
    `Payment: ${registration.paymentStatus}${registration.paymentMethod ? ` (${registration.paymentMethod})` : ""}`,
    `Source: ${registration.source}`,
    `Class date: ${formatEventDate(event.eventDate)}`,
    `Schedule: ${schedule}`,
    priceLabel ? `Fee: ${priceLabel}` : "",
    registration.notes ? `Notes: ${registration.notes}` : "",
    `Registration ID: ${registration.id}`,
    "",
    `Manage in admin: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p><strong>New ${escapeHtml(registration.status)} registration</strong> for ${escapeHtml(event.title)}</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(registration.registrantName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(registration.registrantEmail)}</li>
      ${registration.registrantPhone ? `<li><strong>Phone:</strong> ${escapeHtml(registration.registrantPhone)}</li>` : ""}
      <li><strong>Status:</strong> ${escapeHtml(registration.status)}</li>
      <li><strong>Payment:</strong> ${escapeHtml(registration.paymentStatus)}${registration.paymentMethod ? ` (${escapeHtml(registration.paymentMethod)})` : ""}</li>
      <li><strong>Source:</strong> ${escapeHtml(registration.source)}</li>
      <li><strong>Schedule:</strong> ${escapeHtml(schedule)}</li>
      ${registration.notes ? `<li><strong>Notes:</strong> ${escapeHtml(registration.notes)}</li>` : ""}
      <li><strong>Registration ID:</strong> ${escapeHtml(registration.id)}</li>
    </ul>
    <p><a href="${escapeHtml(adminUrl)}">Open events admin</a></p>
  `.trim();

  return { subject, text, html };
};

export const buildInstructorRegistrationAlertEmail = (
  event: EventItem,
  registration: ClassRegistration,
  options?: { rosterUrl?: string | null }
) => {
  const schedule = buildScheduleLine(event);
  const rosterUrl = options?.rosterUrl ?? null;
  const paymentLabel = formatPaymentStatusLabel(registration);

  const subject = `New registration — ${event.title}`;
  const text = [
    `A new ${registration.status} registration was received for ${event.title}.`,
    "",
    `Name: ${registration.registrantName}`,
    `Email: ${registration.registrantEmail}`,
    registration.registrantPhone ? `Phone: ${registration.registrantPhone}` : "",
    `Status: ${registration.status}`,
    `Payment: ${paymentLabel}`,
    `Schedule: ${schedule}`,
    registration.notes ? `Notes: ${registration.notes}` : "",
    "",
    rosterUrl
      ? `View the class roster (read-only): ${rosterUrl}`
      : "Roster link unavailable — confirm instructor email is set on the class listing.",
    "",
    `Questions for the Nurture team? Email ${nestingPlaceContactEmail}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p><strong>New ${escapeHtml(registration.status)} registration</strong> for ${escapeHtml(event.title)}</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(registration.registrantName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(registration.registrantEmail)}</li>
      ${registration.registrantPhone ? `<li><strong>Phone:</strong> ${escapeHtml(registration.registrantPhone)}</li>` : ""}
      <li><strong>Status:</strong> ${escapeHtml(registration.status)}</li>
      <li><strong>Payment:</strong> ${escapeHtml(paymentLabel)}</li>
      <li><strong>Schedule:</strong> ${escapeHtml(schedule)}</li>
      ${registration.notes ? `<li><strong>Notes:</strong> ${escapeHtml(registration.notes)}</li>` : ""}
    </ul>
    ${
      rosterUrl
        ? `<p><a href="${escapeHtml(rosterUrl)}">Open class roster</a> (read-only link for instructors)</p>`
        : "<p>Roster link unavailable — confirm instructor email is set on the class listing.</p>"
    }
    <p>Questions for the Nurture team? <a href="mailto:${escapeHtml(nestingPlaceContactEmail)}">${escapeHtml(nestingPlaceContactEmail)}</a></p>
  `.trim();

  return { subject, text, html };
};
