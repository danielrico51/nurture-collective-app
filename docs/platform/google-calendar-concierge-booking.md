# Google Calendar API — live scheduling for the concierge

Implementation plan for **real availability** and **confirmed bookings** in the intake concierge. Use this doc when Google Calendar API credentials are ready.

**Related today:** `src/config/bookings.ts` (embed/link only), `src/app/api/webhooks/google-bookings/route.ts` (placeholder forward to n8n), Calendly path in Stage 3 of [process-flow.md](./process-flow.md).

---

## Goals

| Goal | Detail |
|------|--------|
| Show **real open slots** | Query coordinator calendar(s); never invent times in LLM text |
| **Book from the app** | Create a Calendar event + optional Meet link; store booking on lead/intake |
| **Concierge handoff** | After intake (or when user asks), offer a slot picker — not free-form “Tuesday at 3” |
| **Ops parity** | Emit `consult.booked` (Slack + n8n) like Calendly webhook today |

## Non-goals (v1)

- Replacing Calendly for all marketing pages on day one (keep embed fallback)
- Multi-coordinator round-robin (single calendar ID first)
- Reschedule/cancel in chat (link to Google Calendar invite or coordinator)
- Google **Appointment Schedules** product API (use **Calendar API v3** against a shared coordinator calendar)

---

## Current vs target

```mermaid
sequenceDiagram
  participant User
  participant Concierge as Concierge UI + LLM
  participant API as Next.js API
  participant GCal as Google Calendar API
  participant Slack as Slack / n8n

  Note over User,Slack: Today
  User->>Concierge: Chat (intake)
  Concierge-->>User: May suggest times (no API)
  User->>User: Opens Calendly embed / link
  User->>Slack: Calendly webhook after manual book

  Note over User,Slack: Target
  User->>Concierge: Chat (intake)
  Concierge->>API: GET /api/scheduling/availability
  API->>GCal: freebusy.query
  GCal-->>API: busy blocks
  API-->>Concierge: Slot list
  Concierge-->>User: Pick a slot (chips / picker)
  User->>API: POST /api/scheduling/book
  API->>GCal: events.insert
  GCal-->>API: event id, htmlLink
  API-->>User: Confirmed time
  API->>Slack: consult.booked
```

---

## Prerequisites (credentials checklist)

Complete in Google Cloud Console + Workspace **before** coding:

1. **GCP project** with Workspace **Calendar API** enabled (`calendar-json.googleapis.com` — not `calendar.googleapis.com` or Calendar MCP). One-command setup: `npm run setup:concierge-scheduling`.
2. **Service account** (recommended for server-side booking):
   - JSON key downloaded → store in Amplify secret / `.env.local` (never commit).
   - **Domain-wide delegation** if booking on a human calendar (`user@thenestingplacenj.com`): admin grants `https://www.googleapis.com/auth/calendar` (+ `calendar.events` scope) to the SA client ID.
3. **Calendar ID** to read/write (often the coordinator’s email or a dedicated “Intro Calls” calendar).
4. **Event template decisions:**
   - Duration (e.g. 30 min intro call)
   - Buffer between events (e.g. 15 min)
   - Working hours + timezone (e.g. `America/New_York`, Mon–Fri 9–5)
   - Default title: `Maternal Support Introductory Call`
5. **Push notifications (optional v1.1):** Calendar `events.watch` → channel URL, or continue relying on **n8n / Apps Script** POST to `/api/webhooks/google-bookings` when an event is created externally.

### Env vars (add to `.env.local` + Amplify)

```bash
# Provider switch (existing)
NEXT_PUBLIC_BOOKING_PROVIDER=google

# Fallback public page if API down (existing)
NEXT_PUBLIC_GOOGLE_BOOKING_URL=

# --- Google Calendar API (server-only, new) ---
GOOGLE_CALENDAR_ENABLED=false          # feature flag until tested
GOOGLE_CALENDAR_ID=coordinator@domain.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
# One of:
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Or JSON blob:
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

GOOGLE_BOOKING_DURATION_MINUTES=30
GOOGLE_BOOKING_BUFFER_MINUTES=15
GOOGLE_BOOKING_TIMEZONE=America/New_York
GOOGLE_BOOKING_WORK_HOURS_START=09:00
GOOGLE_BOOKING_WORK_HOURS_END=17:00
GOOGLE_BOOKING_WORK_DAYS=1,2,3,4,5   # Mon=1 .. Sun=0 per JS getDay, document in config

# Existing webhook forward (keep)
GOOGLE_BOOKINGS_WEBHOOK_SECRET=
N8N_GOOGLE_BOOKINGS_WEBHOOK_URL=
```

**Dependency to add:** `googleapis` (official client) or `@googleapis/calendar` + `google-auth-library`.

---

## Phased implementation

### Phase 0 — Scaffold (no credentials required)

**Done / in repo:**

- `src/lib/scheduling/types.ts` — shared types
- `src/lib/scheduling/config.ts` — env + feature flag
- `src/lib/scheduling/errors.ts` — `SchedulingNotConfiguredError`, etc.

**Still do:**

- [ ] `npm install googleapis` (or `@googleapis/calendar` + `google-auth-library`)
- [ ] `src/lib/scheduling/google/client.ts` — auth helper (SA + impersonation subject)
- [ ] Unit tests with mocked Calendar client

### Phase 1 — Availability API

**Files:**

| File | Purpose |
|------|---------|
| `src/lib/scheduling/google/availability.ts` | `listAvailableSlots({ from, to, timezone })` |
| `src/app/api/scheduling/availability/route.ts` | `GET` authenticated (member/guest intake session) |

**Algorithm (v1):**

1. Define window: now + 2 hours → now + 14 days (configurable).
2. `calendar.freebusy.query` for `GOOGLE_CALENDAR_ID`.
3. Generate candidate slots every `duration + buffer` within work hours / work days.
4. Subtract busy intervals; return ISO start + display label (local TZ).

**Response shape:** see `SchedulingAvailabilityResponse` in `types.ts`.

**Auth:** Same as conversation routes — `requireAuthUserOrGuest` + optional rate limit per `userId`.

### Phase 2 — Book API + persistence

**Files:**

| File | Purpose |
|------|---------|
| `src/lib/scheduling/google/book.ts` | `createIntroCallBooking({ slotStart, attendee })` |
| `src/lib/scheduling/storage.ts` | Persist `ConsultBooking` under intake partition (mirror lead storage pattern) |
| `src/app/api/scheduling/book/route.ts` | `POST { slotStartIso, sessionId?, intakeProfileId? }` |

**`events.insert` payload (v1):**

- `summary`, `description` (intake summary link / session id)
- `start` / `end` dateTime + `timeZone`
- `attendees`: invitee email (if present)
- `conferenceData` + `conferenceDataVersion: 1` if Google Meet desired
- `extendedProperties.private`: `nurtureUserId`, `conversationSessionId`, `leadId`

**Idempotency:** Client sends `Idempotency-Key` header; server stores key → event id to avoid double-book on retry.

**On success:**

- Save `ConsultBooking` record
- Call `notifyConsultBooked` (reuse `ConsultBookedDetails` from `src/lib/integrations/slack/messages.ts`)
- Forward to n8n (same as Calendly webhook payload shape where possible)

### Phase 3 — Concierge UI (slot picker)

**Principle:** LLM **must not** state specific calendar times unless they came from the availability API in the same session.

**Files:**

| File | Purpose |
|------|---------|
| `src/components/Intake/SchedulingSlotPicker.tsx` | Fetches availability; grid or chip list |
| `src/components/Intake/ConversationalIntake.tsx` | Show picker when `readyToComplete` or explicit “book a call” quick reply |
| `src/lib/api/schedulingClient.ts` | `fetchAvailability`, `bookSlot` |

**UX flow:**

1. Intake reaches `readyToComplete` (or user taps “Book introductory call”).
2. Assistant message: “Here are times that are actually open — pick one below.”
3. Picker loads slots; user selects → `POST /api/scheduling/book`.
4. On success: assistant bubble with confirmed time + “Add to calendar” link (`htmlLink`).
5. On failure: inline error; keep embed fallback button (`buildBookingUrlWithPrefill`).

**Feature flag:** `GOOGLE_CALENDAR_ENABLED` — if false, show existing Calendly card only.

### Phase 4 — LLM guardrails

**Update `src/lib/conversation/prompts.ts` (`CONCIERGE_SYSTEM_PROMPT`):**

```
SCHEDULING:
- You do NOT have access to the live calendar.
- Never confirm a specific date/time unless the app has shown the user a slot picker and they selected a slot.
- When the family wants a call, say our team shares real openings in the scheduler below, or invite them to tap "Book introductory call".
- You may collect general preferences (days/times) for the coordinator — stored as preferredSchedule only.
```

**Optional:** Inject a system message when slots are loaded:

```json
{ "role": "system", "content": "AVAILABLE_SLOTS (do not invent others): [...]" }
```

Only include slots returned by Phase 1 in that turn — never stale slots.

### Phase 5 — Webhook / external bookings

**Path A (in-app book):** Phase 2 already notifies Slack/n8n.

**Path B (user books via public Google Appointment page):** Enhance `src/app/api/webhooks/google-bookings/route.ts`:

- [ ] `src/lib/integrations/google/calendarWebhook.ts` — parse Apps Script / n8n normalized payload → `ConsultBookedDetails`
- [ ] `notifyConsultBooked` + link to lead by email

**Path C (Calendar push notifications, later):** `events.watch` → internal route to sync cancellations.

---

## API contracts (summary)

### `GET /api/scheduling/availability`

Query: `?days=14&duration=30` (optional overrides)

Response:

```json
{
  "timezone": "America/New_York",
  "slots": [
    { "start": "2026-06-03T14:00:00-04:00", "end": "...", "label": "Tue, Jun 3 · 2:00 PM ET" }
  ]
}
```

Errors: `503` if not configured; `401` if unauthenticated.

### `POST /api/scheduling/book`

Body:

```json
{
  "slotStart": "2026-06-03T14:00:00-04:00",
  "conversationSessionId": "uuid",
  "attendee": { "name": "...", "email": "...", "phone": "..." }
}
```

Response:

```json
{
  "booking": {
    "eventId": "...",
    "htmlLink": "https://calendar.google.com/...",
    "start": "...",
    "end": "...",
    "meetLink": "https://meet.google.com/..."
  }
}
```

---

## Data model

Add to intake/lead partition (S3 or local `.data`):

```typescript
// src/lib/scheduling/types.ts — ConsultBooking
{
  id: string;
  userId: string;
  conversationSessionId?: string;
  googleEventId: string;
  start: string;      // ISO
  end: string;
  timezone: string;
  attendeeName: string;
  attendeeEmail: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  source: "concierge" | "embed" | "webhook";
}
```

Index by `userId` + `start` for dashboard “Upcoming call” card.

---

## Security

- **Server-only** credentials; never expose SA key to client.
- Validate `slotStart` is in the list returned by availability (server-side cache or re-query freebusy before insert).
- Reject slots in the past or outside work hours.
- Rate-limit availability + book per user/IP.
- Log booking attempts; no PII in client console.

---

## Testing

| Test | Type |
|------|------|
| Slot generation respects busy blocks | Unit (mock freebusy) |
| Work hours / TZ edge cases (DST) | Unit |
| Book creates event with correct duration | Integration (test calendar) |
| Idempotent double POST | Integration |
| Concierge prompt: no invented times | Manual / eval |
| `GOOGLE_CALENDAR_ENABLED=false` → embed fallback | E2E |

Use a dedicated **Google test calendar**; never run integration tests against production coordinator calendar.

---

## Rollout

1. Deploy with `GOOGLE_CALENDAR_ENABLED=false` — no behavior change.
2. Staging: enable flag + test calendar; internal dogfood on `/care/start`.
3. Production: enable for guest + member intake; keep `NEXT_PUBLIC_GOOGLE_BOOKING_URL` as fallback.
4. Monitor Slack `#scheduled-calls` + booking error logs.
5. Deprecate Calendly embed when Google path is stable (`NEXT_PUBLIC_BOOKING_PROVIDER=google` only).

---

## File checklist (implementation order)

```
src/lib/scheduling/
  types.ts              ✅ scaffold
  config.ts             ✅ scaffold
  errors.ts             ✅ scaffold
  storage.ts            TODO
  google/
    client.ts           TODO — JWT auth + calendar client
    availability.ts     TODO
    book.ts             TODO
src/lib/api/schedulingClient.ts     TODO
src/app/api/scheduling/
  availability/route.ts             TODO
  book/route.ts                     TODO
src/components/Intake/
  SchedulingSlotPicker.tsx          TODO
src/lib/conversation/prompts.ts     TODO — scheduling rules
src/lib/integrations/google/
  parseConsultBooked.ts             TODO — webhook normalizer
src/app/api/webhooks/google-bookings/route.ts  TODO — Slack notify
.env.example                        TODO — full var block
package.json                        TODO — googleapis
docs/platform/process-flow.md       TODO — link Stage 3 API path
```

---

## Open decisions (confirm before build)

1. **Single calendar vs pool** — v1 single `GOOGLE_CALENDAR_ID`?
2. **Meet link** — always create Google Meet conference?
3. **Guest users** — book without account using email from intake only?
4. **Confirmation email** — SES template now or n8n-only?
5. **Coordinator impersonation** — SA delegates to `barb@...` or dedicated resource calendar?

---

## Quick start when credentials arrive

```bash
# 1. Install
npm install googleapis

# 2. Configure .env.local (see Prerequisites)

# 3. Implement in order
#    client.ts → availability.ts → availability route →
#    book.ts → book route → SchedulingSlotPicker → prompts → webhook parser

# 4. Enable
GOOGLE_CALENDAR_ENABLED=true
NEXT_PUBLIC_BOOKING_PROVIDER=google

# 5. Verify
curl -H "Authorization: Bearer …" "http://localhost:3000/api/scheduling/availability"
```
