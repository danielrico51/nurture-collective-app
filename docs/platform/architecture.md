# Nurture Collective — AI-Native Operational Platform Architecture

## Design principles

1. **S3 is canonical** — all operational truth lives in versioned, partitioned JSON objects.
2. **Append-only history** — every change gets a new `file_datetime=YYYY-MM-DDTHH-MM-SSZ` partition.
3. **Events are immutable** — `nurture-events` bucket is the audit + analytics spine.
4. **Indexes are projections** — OpenSearch/DynamoDB for search; never the source of truth.
5. **Actions orchestrate** — workflow logic lives in `services/actions/`, not HTTP controllers.
6. **AI outputs are artifacts** — never only in logs or chat memory.

## Repository layout

```
nurture-collective-app/
├── src/                    # Next.js 15 — marketing, AI intake, client portal (Phase 1)
├── backend/                # Django 5 + DRF + Celery — action engine, workflows
├── infrastructure/aws/     # CloudFormation, IAM policies, provision scripts
├── docs/platform/          # Process flow + architecture
└── amplify/                # Cognito (existing Gen 2)
```

## Runtime topology

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐           ┌────────▼────────┐
     │ Amplify Hosting │           │  Django API     │
     │ Next.js SSR     │           │  (ECS/EC2/EB)   │
     └────────┬────────┘           └────────┬────────┘
              │                             │
              │         ┌───────────────────┤
              │         │                   │
     ┌────────▼─────────▼───┐      ┌────────▼────────┐
     │    AWS Cognito       │      │  Celery + Redis │
     └──────────────────────┘      └────────┬────────┘
                                              │
     ┌────────────────────────────────────────┼────────────────────┐
     │                    AWS S3 (canonical)                         │
     │  nurture-leads │ nurture-clients │ nurture-events │ ...       │
     └────────────────────────────────────────┬───────────────────────┘
                                              │
              ┌───────────────┬───────────────┼───────────────┐
              │               │               │               │
     ┌────────▼────┐  ┌───────▼──────┐ ┌─────▼─────┐ ┌───────▼──────┐
     │ EventBridge │  │  OpenSearch  │ │   Athena  │ │ Slack/SES/   │
     │             │  │  (index)     │ │  + Glue   │ │ Calendly/    │
     └─────────────┘  └──────────────┘ └───────────┘ │ Google Sign  │
                                                       └──────────────┘
```

## S3 buckets

| Bucket | Purpose |
|--------|---------|
| `nurture-leads` | Pre-conversion lead lifecycle |
| `nurture-clients` | Post-conversion client records |
| `nurture-events` | Immutable event stream (Hive partitions) |
| `nurture-contracts` | Contract drafts, approvals, signatures |
| `nurture-proposals` | Proposal versions |
| `nurture-notifications` | Notification delivery records |
| `nurture-analytics` | Curated datasets for Athena/QuickSight |

Legacy: `nurture-collective-tasks` (admin tasks) — remains until migrated.

## Lead partition template

```
s3://nurture-leads/leads/lead_id={lead_id}/
  intake/file_datetime=2026-05-26T10-00-00Z/intake.json
  conversations/file_datetime=2026-05-26T10-05-00Z/conversation.json
  coordinator_notes/file_datetime=2026-05-26T11-00-00Z/note.json
  ai/summaries/file_datetime=2026-05-26T11-05-00Z/summary.json
  scheduling/file_datetime=2026-05-26T12-00-00Z/consult.json
  proposals/file_datetime=2026-05-27T09-00-00Z/proposal_v1.json
  events/file_datetime=2026-05-26T10-00-00Z/event.json
```

## Event schema

```json
{
  "event_id": "evt_uuid",
  "event_type": "consult.booked",
  "entity_type": "lead",
  "entity_id": "lead_abc123",
  "timestamp": "2026-05-26T12:00:00Z",
  "actor": { "type": "system|user|coordinator", "id": "" },
  "payload": {}
}
```

## Action engine API

```
POST /api/v1/actions/execute
Authorization: Bearer <Cognito JWT>

{
  "entity_type": "lead",
  "entity_id": "lead_123",
  "action": "schedule_consultation",
  "params": {}
}
```

Registered actions: see `backend/services/actions/registry.py`.

## Identity & RBAC

| Role | Cognito group | Capabilities |
|------|---------------|--------------|
| Lead/Member | (authenticated) | Own intake, book calls, portal |
| Coordinator | `coordinator` | Lead read/write, call logs, proposals |
| Management | `admin` | Contract approval, analytics |
| System | IAM role | S3, EventBridge, AI |

## Integration matrix

| Integration | Direction | Use |
|-------------|-----------|-----|
| OpenAI | Outbound | Intake, summaries, proposals, contracts |
| Calendly / Google Bookings | Inbound webhooks | `consult.booked` |
| Slack | Bi-directional | Notifications + slash commands |
| SES | Outbound | Transactional email |
| Google Sign / DocuSign | Bi-directional | E-signature |
| n8n | Optional | Legacy bridge during migration |

## Security

- SSE-S3 or SSE-KMS on all buckets
- Bucket versioning + access logging
- IAM least-privilege per service role
- JWT validation on all API routes
- Signed URLs for document download
- PHI-minimal design: encrypt at rest, audit access, no PHI in Slack

## Analytics path

1. Events land in `nurture-events` with Hive partitions
2. Glue crawler registers tables
3. Athena SQL for funnels, coordinator metrics, AI score trends
4. QuickSight dashboards for management
