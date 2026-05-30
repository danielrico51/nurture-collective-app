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

**Easiest start:** import `docs/platform/n8n-website-intake-workflow-minimal.json` — webhook → normalize → email only (no S3; the website already stores leads).

Full workflow (optional S3 backup in n8n): `docs/platform/n8n-website-intake-workflow.json`

Recommended nodes (minimal):

1. **Webhook** — `POST /intake`, respond immediately `200`
2. **Set** — add `received_at`, `workflow_version=1`
3. **Email** — dev notification only (no WhatsApp in phase 1)

Optional in the full workflow: S3 upload node (redundant if `NURTURE_LEADS_BUCKET` is set on Amplify).

### n8n Cloud: “access to env vars denied”

n8n Cloud blocks `$env.VARIABLE` in workflow expressions by default.

- Do **not** use `$env.LEADS_BUCKET` or similar in nodes — hardcode values or remove S3 nodes (the website already stores leads).
- Prefer the **Gmail** node with OAuth for `danielrico51@gmail.com` instead of the generic **Email Send** node if SMTP/env issues persist.
- Re-import `n8n-website-intake-workflow-minimal.json` (uses Gmail node, no `$env`).

## Frontend

The contact page (`/contact`) submits to `/api/intake/submit` with:

- loading/disabled submit state
- success confirmation
- retry on failure
- duplicate submission guard

## Phase 2 (not implemented)

WhatsApp Business, AI intake bot, scheduling automation, and human handoff will plug into the n8n notification layer later.
