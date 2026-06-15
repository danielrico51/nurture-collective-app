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
| `GOOGLE_PROPOSAL_TEMPLATE_DOC_ID` | Master Google Doc with placeholders |
| `GOOGLE_PROPOSAL_DRIVE_FOLDER_ID` | Optional Drive folder for copies |
| `PROPOSAL_LIBRARY_S3_BUCKET` | S3 bucket for style library (defaults to `TASKS_S3_BUCKET`) |
| `PROPOSAL_LIBRARY_S3_PREFIX` | Optional override; dev default `proposal-library/dev/` |
| `PROPOSAL_SIGNATURE_WEBHOOK_SECRET` | `x-proposal-signature-secret` header for webhook auth |

Google Docs uses the same service account / delegated user as Calendar and Tasks. Ensure domain-wide delegation includes **Google Docs API** and **Google Drive API** scopes.

### Template placeholders

```
{{CLIENT_NAME}}
{{EXECUTIVE_SUMMARY}}
{{SERVICES}}
{{PRICING}}
{{TIMELINE}}
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
