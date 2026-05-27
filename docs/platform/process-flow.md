# Nurture Collective — Full Client Intake & Conversion Process Flow

This document defines the end-to-end operational journey from discovery through signed contract, mapped to systems, touchpoints, automations, and S3 artifacts.

**Canonical datastore:** AWS S3 (append-only, `file_datetime` partitions)  
**Identity:** AWS Cognito  
**Frontend:** Next.js (marketing, AI intake, client portal)  
**Orchestration:** Django API + Celery + EventBridge + n8n/Slack  
**AI:** OpenAI (intake, summaries, scoring, proposals, contracts)

---

## Lifecycle overview

```
Discovery → AI Intake → Book Consult → Coordinator Prep → Call → Follow-up
    → Proposal → Slack Ops → Contract Draft → Management Review → E-Sign → Client
```

| Stage | Entity | Primary owner |
|-------|--------|---------------|
| Pre-account | **Lead** | Marketing + AI concierge |
| Post-sign | **Client** | Coordinator + care team |

Leads and clients are **never merged in storage**. Conversion creates a new `client_id` with a `lead_reference.json` artifact.

---

## Stage 1 — Discovery & awareness

**How they find us:** Google search, Google Business Profile, Instagram, referrals, For Moms landing pages.

| Touchpoint | System | Output |
|------------|--------|--------|
| SEO / GBP listing | Google | Traffic |
| Social posts | Meta / organic | Link clicks |
| Landing pages | Next.js (`/for-moms`, `/services`) | Session, UTM capture |
| “Request care” CTA | `/care/start` → Cognito sign-in | Authenticated session |

**Automation (future):** UTM + referrer stored on first `lead.created` event.

**S3 artifact:** none yet (anonymous). After auth → Stage 2.

---

## Stage 2 — AI conversational intake

**Owner:** AI concierge (OpenAI) + Next.js chat UI  
**Goal:** Build structured maternal profile without form fatigue.

| Step | Actor | Action | Artifact |
|------|-------|--------|----------|
| 2.1 | Client | Starts chat at `/dashboard/intake` | `conversations/.../conversation.json` |
| 2.2 | AI | Streams questions, quick replies, emotional signals | Live `extractedProfile` in session |
| 2.3 | System | Persists each turn; syncs intake draft | `intake/file_datetime=.../intake.json` (legacy path → migrates to `nurture-leads`) |
| 2.4 | Client | Completes intake explicitly | `intake.completed` event |
| 2.5 | AI | Generates recommendations | `ai/recommendations/file_datetime=.../` |
| 2.6 | System | Lead record created/updated | `leads/lead_id={id}/intake/...` |

**Events emitted:**
- `lead.created` (first meaningful intake)
- `intake.started`
- `intake.completed`
- `ai.summary.requested` → `ai/summaries/.../summary.json`

**Notifications:**
- Slack `#new-leads` — name, stage, score, link to admin queue
- Optional SES — “Thanks for sharing — book your coordinator call”

**Points of contact:** AI chat only (no human yet).

---

## Stage 3 — Book follow-up consultation

**Owner:** Client (self-serve) + booking provider  
**CTA:** Dashboard, post-intake message, For Moms embed.

| Provider | Integration | Webhook |
|----------|-------------|---------|
| Calendly (interim) | `NEXT_PUBLIC_CALENDLY_URL` + embed | `/api/webhooks/calendly` |
| Google Workspace (target) | `NEXT_PUBLIC_GOOGLE_BOOKING_URL` | `/api/webhooks/google-bookings` |

| Step | Action | Artifact |
|------|--------|----------|
| 3.1 | Client books discovery / follow-up call | External calendar event |
| 3.2 | Webhook received | `scheduling/file_datetime=.../consult.json` |
| 3.3 | Event emitted | `consult.booked` |
| 3.4 | Index updated | OpenSearch/Dynamo projection |
| 3.5 | Coordinator assigned (rule or round-robin) | `coordinator_notes/...` or lead metadata |

**Notifications:**
- Slack `#scheduled-calls` — time, lead link, intake summary snippet
- SES confirmation to client
- Coordinator calendar invite (Google Calendar sync)

**Points of contact:** Booking UI (Calendly/Google), confirmation email.

---

## Stage 4 — Coordinator preparation

**Owner:** Client coordinator  
**Goal:** Walk into the call informed.

| Input | Source |
|-------|--------|
| Chat transcript | `conversations/.../conversation.json` |
| Structured intake | `intake/.../intake.json` |
| AI coordinator brief | `ai/summaries/.../summary.json` |
| Lead score / sentiment | `ai/lead_scores/`, `ai/sentiment/` |
| Booking details | `scheduling/.../consult.json` |

| Step | Action | Artifact |
|------|--------|----------|
| 4.1 | AI generates prep brief (async Celery job) | `ai/summaries/file_datetime=.../summary.json` |
| 4.2 | Coordinator reviews in dashboard | Read-only S3 projections |
| 4.3 | Coordinator adds pre-call notes | `coordinator_notes/file_datetime=.../note.json` |

**Automation:** Triggered on `consult.booked` → AI summary + Slack thread with prep link.

**Points of contact:** Internal coordinator dashboard (Django API + Next.js admin).

---

## Stage 5 — Consultation call

**Owner:** Client coordinator  
**Channel:** Phone / Google Meet / Zoom

| Step | Action | Artifact |
|------|--------|----------|
| 5.1 | Call happens | — |
| 5.2 | Coordinator logs call (or AI transcribes recording) | `coordinator_notes/file_datetime=.../call_log.json` |
| 5.3 | Optional Whisper transcription | `communication/.../transcript.json` |
| 5.4 | AI post-call summary | `ai/summaries/.../post_call_summary.json` |
| 5.5 | Event | `consult.completed` |

**Call log schema (minimum):**
```json
{
  "call_id": "",
  "lead_id": "",
  "coordinator_id": "",
  "started_at": "",
  "duration_minutes": 0,
  "outcome": "qualified|nurture|not_fit|no_show",
  "notes": "",
  "next_steps": []
}
```

**Points of contact:** Voice/video call (human).

---

## Stage 6 — Client wait & follow-up

**Owner:** Client + coordinator  
**Channels:** WhatsApp, email, dashboard messaging (future)

| Scenario | Action |
|----------|--------|
| Client has questions | WhatsApp / email → coordinator |
| Client goes quiet | Automated nurture sequence (Sprint 3) |
| Coordinator checks in | Manual or AI-drafted follow-up |

**Artifacts:**
- `communication/file_datetime=.../message.json`
- `ai/followups/file_datetime=.../draft.json` (AI-drafted, human-approved)

**Events:** `followup.sent`, `lead.stale` (if no activity N days)

**Points of contact:** WhatsApp, email, optional client portal messages.

---

## Stage 7 — Proposal & materials

**Owner:** Coordinator (+ AI assist)  
**Goal:** Send tailored care proposal.

| Step | Action | Artifact |
|------|--------|----------|
| 7.1 | Coordinator triggers `generate_proposal` action | Celery job |
| 7.2 | AI drafts proposal from intake + call log | `proposals/file_datetime=.../proposal_v1.json` |
| 7.3 | Human review & edit | New `file_datetime` version (never overwrite) |
| 7.4 | Send to client | SES + portal link |
| 7.5 | Event | `proposal.sent` |

**Storage:** `s3://nurture-proposals/` (copy linked from lead partition)

**Points of contact:** Email with proposal PDF/link, client portal.

---

## Stage 8 — Slack operations handoff

**Owner:** Coordinator  
**Channel:** Slack `#operations` or thread on `#scheduled-calls`

| Payload posted |
|----------------|
| Lead summary |
| Call log link |
| Proposal status |
| Recommended next action buttons |

**Slack slash commands (Sprint 2+):**
- `/send-proposal {lead_id}`
- `/create-contract {lead_id}`
- `/mark-stale {lead_id}`
- `/convert-client {lead_id}`

Each command → `POST /actions/execute` on Django API.

---

## Stage 9 — Outcome branch

### 9A — Lost / disengaged

| Signal | Automation |
|--------|------------|
| No reply after proposal | `lead.stale` event |
| Coordinator marks lost | `lead.lost` action |
| Slack | `#lost-leads` notification |
| Analytics | Funnel drop-off in Athena |

### 9B — Ready for contract

| Step | Action |
|------|--------|
| Client confirms interest | Coordinator or client portal CTA |
| Slack `/create-contract` or dashboard action | `contract.draft.requested` |
| AI generates contract draft | `nurture-contracts/.../draft_v1.json` |
| Management review queue | Status `pending_review` |
| Approved | `contract.approved` |
| Sent for signature | Google Sign / DocuSign |
| Signed | `contract.signed` → **convert_to_client** |

**Points of contact:** Email (signature link), coordinator phone/email.

---

## Stage 10 — Contract & conversion

| Step | Action | Artifact |
|------|--------|----------|
| 10.1 | AI + template → draft contract | `contracts/.../draft.json` |
| 10.2 | Management approves | `contracts/.../approved.json` |
| 10.3 | E-sign envelope sent | Integration metadata JSON |
| 10.4 | Client signs | `contracts/.../signed_contract.json` |
| 10.5 | `convert_to_client` action | `client_id` created |
| 10.6 | Cognito user provisioned / linked | `clients/.../identity/cognito.json` |
| 10.7 | Lead reference preserved | `clients/.../references/lead_reference.json` |
| 10.8 | Event | `client.created`, `lead.converted` |

**Post-conversion:** Bookings, care plans, payments live under `s3://nurture-clients/`.

---

## System map — points of contact

| Role | Surfaces |
|------|----------|
| **Prospect / lead** | Website, AI chat, Calendly/Google booking, WhatsApp, email |
| **Client coordinator** | Admin intake queue, coordinator dashboard, Slack, Google Calendar |
| **Management** | Contract review queue, analytics (QuickSight/Athena) |
| **Care team** | Slack `#operations`, future provider portal |
| **Automation** | n8n, Celery, EventBridge, OpenAI, webhooks |

---

## Event catalog (append-only)

| Event type | Trigger |
|------------|---------|
| `lead.created` | First intake persistence |
| `intake.completed` | User submits intake |
| `consult.booked` | Calendly/Google webhook |
| `consult.completed` | Call log saved |
| `ai.summary.generated` | Celery AI job done |
| `proposal.sent` | Coordinator sends proposal |
| `contract.draft.created` | Action engine |
| `contract.approved` | Management review |
| `contract.signed` | E-sign webhook |
| `client.created` | Conversion action |
| `lead.lost` / `lead.stale` | Manual or rule-based |

All events → `s3://nurture-events/year=.../month=.../day=.../event_type=.../`

---

## AI automation map

| Workflow | Model | Trigger | Output artifact |
|----------|-------|---------|-----------------|
| Intake conversation | GPT-4o-mini | User message | Live profile + transcript |
| Intake summary | GPT-4o | `intake.completed` | `ai/summaries/` |
| Lead scoring | GPT-4o | `intake.completed` | `ai/lead_scores/` |
| Sentiment | GPT-4o-mini | Each message | `ai/sentiment/` |
| Coordinator brief | GPT-4o | `consult.booked` | `ai/summaries/` |
| Post-call summary | GPT-4o + Whisper | Call log / recording | `ai/summaries/` |
| Proposal draft | GPT-4o | `generate_proposal` action | `proposals/` |
| Contract draft | GPT-4o | `create_contract` action | `contracts/` |
| Follow-up email | GPT-4o-mini | Stale rules / manual | `ai/followups/` |

---

## Migration from current app (dev branch)

| Today | Target |
|-------|--------|
| `nurture-collective-tasks` / `management/process=intake/` | `nurture-leads/leads/lead_id=.../intake/` |
| `management/process=conversation/` | `nurture-leads/leads/lead_id=.../conversations/` |
| Next.js API routes | Django action engine + shared S3 libs |
| n8n webhooks | EventBridge + Celery workers (n8n remains optional) |

Dual-write period recommended during Sprint 1.

---

## Sprint alignment

| Sprint | Delivers |
|--------|----------|
| **1** | Buckets, IAM, lead S3 writes, intake → lead events, Slack new-lead |
| **2** | Action engine, coordinator dashboard, booking webhooks → scheduling artifacts, search index |
| **3** | Proposals, call logs, AI briefs, Slack commands |
| **4** | Contracts, e-sign, client conversion, analytics (Athena/Glue) |

See [architecture.md](./architecture.md) and [../../infrastructure/aws/README.md](../../infrastructure/aws/README.md) for deployment.
