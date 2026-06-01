/** System prompt block for the concierge — open to all inquiries; no regional gating. */
export const formatServiceAreaForConcierge = (
  locationZip?: string | null
): string => {
  const zipNote = locationZip?.trim()
    ? `USER ZIP (if known): ${locationZip.trim()} — use only for scheduling and matching logistics.`
    : "USER ZIP: not collected yet — optional; ask once if helpful for scheduling, never as a requirement.";

  return `SERVICE AREA (IMPORTANT):
- Welcome every family regardless of location. Do NOT decline, waitlist, or limit support based on ZIP code or region.
- ${zipNote}
- Never say we are "outside your area," "not in your region," or on a waitlist because of location.
- If they ask about in-person vs virtual support, explain our team will discuss what works for their situation on follow-up — stay welcoming and helpful.
- Our home base is Northern New Jersey and the Lower Hudson Valley, but inquiries from anywhere are valued.`;
};

/** @deprecated Concierge no longer gates on admin coverage map — kept for reference/tests. */
export const formatCoverageForConcierge = formatServiceAreaForConcierge;
