# Website Intake Pipeline

End-to-end flow for website inquiries:

```text
Contact form → POST /api/intake/submit → validate/enrich → S3 history → n8n → notifications
```

## Next.js (production on Amplify)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/intake/submit` | POST | Website intake submission |
| `/api/health/intake` | GET | Pipeline health check |

## Django platform API (optional)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/intake/submit` | POST | Same pipeline when Django is deployed |
| `/health/intake/` | GET | Intake health check |

## Payload

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "2015550100",
  "email": "jane@example.com",
  "service_requested": "Postpartum support",
  "message": "How can we support you?",
  "source": "website"
}
```

Required: `first_name`, `service_requested`, and `phone` or `email`.

The API enriches submissions with:

- `lead_id` (UUID v4)
- `created_at` / `updated_at` (ISO)
- `status: "new"`
- `version: 1`
- `lead_source`

## Environment variables

```bash
N8N_WEBHOOK_URL=              # Primary intake webhook (falls back to N8N_INQUIRY_WEBHOOK_URL)
N8N_INQUIRY_WEBHOOK_URL=      # Legacy alias still supported
N8N_WEBHOOK_SECRET=
AWS_REGION=us-east-1
LEADS_BUCKET=                 # Falls back to NURTURE_LEADS_BUCKET
NURTURE_LEADS_BUCKET=
INTAKE_TIMEOUT=15             # seconds
MAX_RETRIES=3
```

Set these in Amplify Console (see `amplify.yml`) and locally in `.env.local`.

## S3 layout

Immutable historical records:

```text
leads/year=YYYY/month=MM/day=DD/lead_id={uuid}/{timestamp}.json
```

Failed automation handoffs:

```text
leads/dead-letter/lead_id={uuid}/{timestamp}_{reason}.json
```

CRM snapshots (admin queue) also write to:

```text
leads/lead_id={uuid}/profile/file_datetime=.../lead_profile.json
```

## n8n workflow

**Easiest start:** import `docs/platform/n8n-website-intake-workflow-minimal.json`:

```text
Webhook → Prepare Lead → Gmail + Twilio team SMS + Twilio mom SMS (if phone)
```

Full workflow (optional S3 backup in n8n): `docs/platform/n8n-website-intake-workflow.json`

### Twilio SMS (Phase 1 — n8n only)

Business number: **+1 (844) 926-2867** (`+18449262867`)

Twilio Phone Number SID (for Console / API reference): `PN848effb3e4edce45f501bfe2e97a1e97`

| Node | Purpose |
|------|---------|
| **SMS Team Alert** | Texts coordinator when a lead arrives |
| **SMS Mom Confirmation** | Auto-reply to the lead if they left a phone number |

**Setup in n8n:**

1. **Credentials** → **Twilio** → Account SID + Auth Token from [Twilio Console](https://console.twilio.com/)
2. Assign credentials to both **SMS** nodes
3. Open **Prepare Lead** (Code node) and edit the top constants if needed:
   - `TWILIO_FROM` — `+18449262867` (already set)
   - `COORDINATOR_SMS_TO` — mobile number that receives team alerts (default `+12626139986`, change in n8n)
   - `APP_URL` — production site URL when you go live (concierge link in mom SMS)
4. **Do not use `$env`** — n8n Cloud blocks it; use literals in the Code node
5. Activate workflow; webhook path stays **`intake`**

**Mom SMS copy (default):**

> Hi {first name}, thanks for contacting The Nesting Place. Our care coordinator will follow up within one business day. You can also continue online: {APP_URL}/care/start

**Twilio trial note:** verify recipient numbers in Twilio Console until the account is production-ready.

**Mom SMS** only sends when the website payload includes `sms_consent: true` (contact form checkbox).

### Twilio toll-free verification — proof of consent

Twilio requires proof that customers **opt in** before you text them on **(844) 926-2867**.

**What to submit in Twilio Console:**

| Field | Suggested answer |
|-------|------------------|
| **Opt-in type** | Web form |
| **Opt-in URL** | `https://dev.d9588bqvrp5xs.amplifyapp.com/contact` (production URL when live) |
| **Opt-in language** | “I agree to receive text messages from The Nesting Place about my inquiry and care coordination. Message and data rates may apply. Reply STOP to opt out.” |
| **Screenshot** | Contact form showing phone field + **unchecked-by-default** SMS checkbox (take after deploy) |
| **Message type** | Transactional — appointment follow-up and care coordination (not marketing blasts) |

**Team alert SMS** (coordinator only) is internal operations — describe separately if Twilio asks about use cases: “Staff notification when a new lead is submitted; not sent to consumers.”

**Important:** Mom confirmation texts in n8n run only when `sms_consent` is `true` in the webhook payload.

### Gmail / team email

The app sends `team_notification_email`, `send_to`, and `notification_email` on every n8n webhook payload (default `info@nesting-place.com`, override with `N8N_TEAM_NOTIFICATION_EMAIL` on Amplify).

1. **Gmail Notification** → OAuth as `info@nesting-place.com` (or a shared ops inbox that forwards there)
2. **To:** `={{ $json.send_to || $json.team_notification_email || 'info@nesting-place.com' }}`
3. No `$env.FROM_EMAIL` — use Gmail OAuth only; do not hardcode personal addresses in the workflow

### n8n Cloud: “access to env vars denied”

n8n Cloud blocks `$env.VARIABLE` in workflow expressions by default.

- Do **not** use `$env.LEADS_BUCKET` or `$env.FROM_EMAIL` in nodes
- Use literals in the **Prepare Lead** Code node or hardcode in node fields
- Deactivate old workflows that still use **Email Send** with `$env`

## Frontend

The contact page (`/contact`) submits to `/api/intake/submit` with:

- loading/disabled submit state
- success confirmation
- retry on failure
- duplicate submission guard

## Phase 2 (not implemented)

Inbound SMS to Twilio → concierge, WhatsApp Business, and two-way AI intake over text.
