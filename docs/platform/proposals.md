# Proposal generation and e-signature

AI-powered proposal workflow integrated into the Lead CRM. Proposals are first-class objects stored as JSON in S3 (or `.data/proposals/` locally).

## Lifecycle

Lead → Discovery call → **Proposal** → Signature → Client

## Storage layout

```
clients/client_id={leadId}/proposals/proposal_id={proposalId}/
  metadata.json
  draft.json
  approved.json
  signed.json
  versions/v{n}.json
  audit/event_datetime={timestamp}/event.json
```

Proposal style library (optional, in `TASKS_S3_BUCKET` or `PROPOSAL_LIBRARY_S3_BUCKET`):

```
proposal-library/{service-type}/proposal.json
```

Built-in style references are used when the S3 library is empty.

## Admin workflow

1. Open **Admin → Leads** and expand a lead.
2. In the **Proposals** panel, click **Generate proposal**.
3. Review the Google Doc (when template is configured) or draft JSON in S3.
4. **Approve** or **Request changes & regenerate** (creates a new version; prior versions are preserved).
5. After approval, enter signer email and **Send for e-signature**.
6. On `SIGNED` webhook, the lead status moves to `converted_to_member` and onboarding scaffold runs.

## Step 3 — Google Doc template

Proposal generation can write JSON to S3 without Google Docs. For coordinator-facing documents, configure a master template.

### One-time: Workspace domain-wide delegation

In **Google Workspace Admin → Security → API controls → Domain-wide delegation**, add these scopes for the nurture-tasks-sync service account client ID:

```
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/drive
```

(Calendar/Tasks scopes stay as-is — this is an additional authorization.)

### Create template + push to Amplify dev

```bash
chmod +x infrastructure/google/setup-proposal-docs.sh

# Creates master doc as admin@nesting-place.com, verifies copy/replace, updates Amplify dev
CREATE_TEMPLATE=true AMPLIFY_BRANCH=dev REDEPLOY=true \
  ./infrastructure/google/setup-proposal-docs.sh
```

Or use an existing Doc ID:

```bash
GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<doc-id> AMPLIFY_BRANCH=dev REDEPLOY=true \
  ./infrastructure/google/setup-proposal-docs.sh
```

### Template placeholders (must match exactly)

Master template follows the **TNP Postpartum Doula Contract** layout (redacted real agreement) with **formatted** Google Docs styling:

- Centered logo (from the original contract)
- Bold section headings and client/date fields
- Native bullet lists for static contract sections

Update in Drive:

```bash
npm run update:proposal-google-template
```

```
{{DATE}}
{{CLIENT_NAME}}
{{SERVICES}}      # SERVICE DETAILS (dynamic bullets)
{{TIMELINE}}      # FOLLOWING THE BIRTH
{{PRICING}}       # FEES (amounts / deposit / balance)
{{TERMS}}         # AGREEMENT
{{NEXT_STEPS}}    # 24-hour offer / signing instructions
```

Static sections (client commitment, doula limitations, payment methods, signature block, TNP services footer) remain in the template. The LLM fills only the placeholders above.

See `src/lib/proposals/proposalDocTemplate.ts` for the canonical section layout.

### Verify only

```bash
GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<doc-id> npm run verify:proposal-docs
```

### Manual template (if API create fails)

1. Create a Google Doc titled **Proposal Template (Master — Nesting Place)**
2. Paste the sections from `proposalDocTemplate.ts`
3. Copy the document ID from the URL (`/document/d/{ID}/edit`)
4. Run `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID={ID} AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-proposals-env.sh`

Optional: set scoped Drive folders so dev and prod proposals stay separated in admin@ Drive:

| Environment | Env var | Example folder |
|-------------|---------|----------------|
| Amplify `dev` | `GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV` | Proposals - DEV |
| Amplify `main` | `GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_PROD` | Proposals - PROD |

`GOOGLE_PROPOSAL_DRIVE_FOLDER_ID` still works as a manual override. At runtime, `APP_ENV` / branch selects the scoped value.

Same pattern applies to `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV` and `_PROD` if you use different master templates per environment.

### Sample contract library (LLM style references)

Historical contracts are redacted and stored as JSON (no client names, EDDs, or doula assignments):

```
proposal-library-seed/dev/entries.json
s3://nurture-collective-tasks/proposal-library/dev/{service_type}/proposal.json
```

Upload or refresh:

```bash
./infrastructure/aws/scripts/seed-proposal-library-s3.sh
```

When S3 entries exist, retrieval uses them instead of built-in examples in `src/lib/proposals/library/builtin.ts`.

The LLM receives the **top-ranked example as `primary_format_example`** (full agreement structure, section headings, tone, and redacted contract text) and adapts it for the lead — mirroring payment patterns, service granularity, and legal terms rather than inventing a generic marketing proposal.

After updating `proposal-library-seed/dev/entries.json`, re-upload:

```bash
./infrastructure/aws/scripts/seed-proposal-library-s3.sh
```

### Google auth on Amplify (production)

Proposal Docs use the **same Workload Identity Federation** as concierge booking — not a separate ADC token.

```bash
# One-time / refresh (dev and main use the same GCP WIF pool):
GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER=643818957131 \
GOOGLE_WORKLOAD_IDENTITY_POOL_ID=nurture-amplify-aws \
GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID=aws-amplify \
GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT=nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com \
AMPLIFY_BRANCH=dev REDEPLOY=true REMOVE_ADC_JSON=true \
./infrastructure/aws/scripts/set-amplify-google-wif-env.sh
```

See `docs/platform/google-calendar-wif.md` for architecture. After WIF is active, remove `GOOGLE_CALENDAR_ADC_JSON` from Amplify so proposals do not fall back to expiring user tokens.

### `invalid_rapt` on Amplify (proposal Google Docs)

This means **Amplify still has an expiring `authorized_user` ADC** instead of WIF. Proposal JSON is saved to S3; only Google Doc creation fails.

Fix: enable shared WIF on the branch (see **Google auth on Amplify** above) with `REMOVE_ADC_JSON=true`, redeploy, then regenerate.

### `invalid_rapt` when running setup scripts locally

```bash
gcloud auth login admin@nesting-place.com
gcloud auth application-default login
npm run setup:proposal-google-template
```

Or skip API creation: build the Doc manually in Google Docs, then set `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID` on Amplify.

## Dev vs production storage

Proposal storage follows the same deployment rules as leads, events, and class registrations:

| Scope | Proposal JSON (`clients/…/proposals/…`) | Style library (`proposal-library/…`) |
|-------|----------------------------------------|--------------------------------------|
| **Amplify `dev` branch** | `nurture-clients-dev-{account}` | `proposal-library/dev/{service}/` |
| **Amplify `main` branch** | `nurture-clients-prod-{account}` | `proposal-library/{service}/` (legacy prod root) |
| **Local machine** | `.data/proposals/local/clients/…` | Built-in examples (S3 optional) |

`amplify.yml` sets `APP_ENV` / `NURTURE_DEPLOYMENT_ENV` from the Git branch. Proposal code reads that via `resolveDeploymentEnvironment()`.

### Amplify setup (recommended)

```bash
chmod +x infrastructure/aws/scripts/set-amplify-proposals-env.sh

# Dev branch — isolated S3 bucket + library prefix
AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-proposals-env.sh

# Production — after merge to main
AMPLIFY_BRANCH=main GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<prod-template> \
  ./infrastructure/aws/scripts/set-amplify-proposals-env.sh
```

The script sets:

- `PROPOSALS_USE_LOCAL_STORAGE=false`
- `PROPOSALS_USE_S3=true`
- `NURTURE_CLIENTS_BUCKET` from CloudFormation (`ClientsBucketName`)
- `PROPOSAL_LIBRARY_S3_BUCKET` (defaults to `nurture-collective-tasks`)
- `PROPOSAL_SIGNATURE_WEBHOOK_SECRET`

Attach IAM access if not already done:

```bash
./infrastructure/aws/scripts/attach-amplify-s3-policy.sh dev NurtureCollectiveAmplifyComputeRole
```

### Local development against dev S3

```bash
PROPOSALS_USE_S3=true
NURTURE_CLIENTS_BUCKET=nurture-clients-dev-ACCOUNT_ID
OPENAI_API_KEY=sk-…
```

### Local-only (no S3)

```bash
PROPOSALS_USE_LOCAL_STORAGE=true
```

Data is written to `.data/proposals/local/clients/{leadId}/{proposalId}/`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NURTURE_CLIENTS_BUCKET` | Primary proposal + client JSON bucket |
| `PROPOSALS_USE_LOCAL_STORAGE` | `true` → `.data/proposals/{env}/` (local dev default when bucket unset) |
| `PROPOSALS_USE_S3` | `true` → force S3 during local dev when bucket is set |
| `OPENAI_API_KEY` | LLM proposal generation |
| `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID` | Master template override (any env) |
| `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV` / `_PROD` | Per-environment master templates |
| `GOOGLE_PROPOSAL_DRIVE_FOLDER_ID` | Drive folder override (any env) |
| `GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV` / `_PROD` | Proposals - DEV / Proposals - PROD folders |
| `PROPOSAL_LIBRARY_S3_BUCKET` | S3 bucket for style library (defaults to `TASKS_S3_BUCKET`) |
| `PROPOSAL_LIBRARY_S3_PREFIX` | Optional override; dev default `proposal-library/dev/` |
| `PROPOSAL_SIGNATURE_WEBHOOK_SECRET` | `x-proposal-signature-secret` header for webhook auth |

Google Docs uses the same service account / delegated user as Calendar and Tasks. Ensure domain-wide delegation includes **Google Docs API** and **Google Drive API** scopes.

### Template placeholders

```
{{DATE}}
{{CLIENT_NAME}}
{{SERVICES}}
{{TIMELINE}}
{{PRICING}}
{{TERMS}}
{{NEXT_STEPS}}
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/proposals?client_id=` | List proposals for a lead |
| `POST` | `/api/proposals/generate` | Generate proposal (`{ client_id }`) |
| `POST` | `/api/proposals/{id}` | `approve` or `revise` (`feedback`) |
| `POST` | `/api/proposals/{id}/send-signature` | Queue e-signature (`signer_email`) |
| `POST` | `/api/proposals/signature/webhook` | Signature events: `SIGNED`, `DECLINED`, `EXPIRED` |

Webhook payload:

```json
{
  "event": "SIGNED",
  "signature_request_id": "sig_…",
  "proposal_id": "uuid",
  "client_id": "lead-uuid"
}
```

## Slack

Notifications post to the **operations** channel (`SLACK_WEBHOOK_OPERATIONS`):

- Proposal generated (under review)
- Proposal approved
- Proposal signed / declined / expired

## MVP limitations

- **Google Workspace E-Signature**: `send-signature` creates a `signature_request_id` stub; wire a real provider (Google Sign, DocuSign, etc.) and call the webhook on completion.
- **Onboarding**: `runClientOnboardingAfterSignature` logs scaffold tasks; Cognito user creation, community membership, and welcome email are follow-up work.
- **Roles**: All admin-app users can generate and approve; refine with Coordinator / Manager groups when Cognito roles are modeled in the app.

## Local development

```bash
PROPOSALS_USE_LOCAL_STORAGE=true
OPENAI_API_KEY=sk-…
```

Proposals persist under `.data/proposals/clients/{leadId}/{proposalId}/`.

Test signature webhook:

```bash
curl -X POST http://localhost:3000/api/proposals/signature/webhook \
  -H "Content-Type: application/json" \
  -H "x-proposal-signature-secret: $PROPOSAL_SIGNATURE_WEBHOOK_SECRET" \
  -d '{"event":"SIGNED","signature_request_id":"sig_test","proposal_id":"…","client_id":"…"}'
```
