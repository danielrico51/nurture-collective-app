# Nurture Collective — Django Platform API

S3-native action engine for lead intake, scheduling, proposals, and client conversion.

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill bucket names from infrastructure/aws stack outputs
python manage.py runserver 8000
```

Health: `GET http://localhost:8000/health/`

Intake health: `GET http://localhost:8000/health/intake/`

Website intake submit:

```bash
curl -X POST http://localhost:8000/api/v1/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "email": "jane@example.com",
    "service_requested": "Postpartum support",
    "message": "Looking for overnight help"
  }'
```

See [../docs/platform/intake-workflow.md](../docs/platform/intake-workflow.md).

## Action engine

```bash
curl -X POST http://localhost:8000/api/v1/actions/execute \
  -H "Content-Type: application/json" \
  -H "X-Actor-Id: coordinator_1" \
  -d '{
    "entity_type": "lead",
    "entity_id": "lead_abc123",
    "action": "record_consult_booking",
    "params": {
      "provider": "calendly",
      "scheduled_at": "2026-05-28T15:00:00Z",
      "event_uri": "https://calendly.com/..."
    }
  }'
```

### Registered actions

| Action | Description |
|--------|-------------|
| `qualify` | Mark lead qualified after intake |
| `assign_coordinator` | Assign coordinator |
| `record_consult_booking` | Persist booking + trigger AI brief |
| `record_call_log` | Post-consult call log |
| `generate_proposal` | Async proposal draft |
| `mark_stale` / `mark_lost` | Pipeline hygiene |
| `create_contract_draft` | Async contract draft |
| `convert_to_client` | Lead → client conversion |

## Celery

```bash
redis-server
celery -A nurture_platform worker -l info
```

## Architecture

See [../docs/platform/architecture.md](../docs/platform/architecture.md) and [../docs/platform/process-flow.md](../docs/platform/process-flow.md).
