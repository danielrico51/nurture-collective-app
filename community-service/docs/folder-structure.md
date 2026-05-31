# Community Service — Folder Structure

```
nurture-collective-app/
├── backend/                    # Existing platform API (leads, intake, actions)
├── frontend/                   # Next.js app (src/)
├── shared/
│   └── auth/
│       └── README.md           # TODO: Cognito JWT shared module
├── infrastructure/
│   └── aws/                    # Existing CloudFormation / S3 buckets
└── community-service/            # ← This service
    ├── README.md
    ├── Dockerfile
    ├── docker-compose.yml
    ├── .env.example
    ├── manage.py
    ├── requirements.txt
    ├── pytest.ini
    │
    ├── community_platform/     # Django project
    │   ├── settings.py
    │   ├── urls.py
    │   ├── asgi.py             # Channels entry
    │   └── wsgi.py
    │
    ├── users/                    # Sprint 1 — profiles, org, auth middleware
    │   ├── models.py
    │   ├── repositories.py
    │   ├── services/
    │   └── migrations/
    │
    ├── communities/              # Sprint 1 — communities + memberships
    │   ├── models.py
    │   ├── repositories.py
    │   ├── services/
    │   └── migrations/
    │
    ├── messaging/                # Sprint 2 — channels, messages, WS
    │   ├── models.py
    │   ├── repositories.py
    │   ├── services/
    │   ├── consumers.py          # TODO Sprint 2
    │   ├── routing.py            # TODO Sprint 2
    │   ├── moderation/
    │   │   └── hooks.py          # Stub hooks
    │   ├── presence/
    │   │   └── hooks.py          # Stub hooks
    │   └── migrations/
    │
    ├── cohorts/                  # Sprint 3 — hard-coded assignment
    │   ├── models.py
    │   ├── repositories.py
    │   ├── services/
    │   │   └── assignment.py     # assign_*_cohort stubs
    │   └── migrations/
    │
    ├── ai_companion/             # Sprint 5 — provider abstraction
    │   ├── models.py
    │   ├── repositories.py
    │   ├── services/
    │   ├── providers/
    │   │   └── base.py
    │   ├── safety/               # TODO Sprint 5
    │   ├── prompts/              # TODO Sprint 5
    │   └── migrations/
    │
    ├── analytics/                # Sprint 4 — emit_event → S3
    │   ├── emitter.py
    │   ├── s3_paths.py
    │   ├── s3_writer.py          # TODO Sprint 4
    │   └── tasks.py              # TODO Sprint 4
    │
    ├── api/                      # Thin HTTP adapters
    │   ├── health.py
    │   └── v1/
    │       ├── urls.py
    │       └── views/            # TODO per sprint
    │           ├── communities.py
    │           ├── messaging.py
    │           ├── cohorts.py
    │           └── ai_companion.py
    │
    ├── infrastructure/
    │   └── feature_flags.py
    │
    ├── tests/
    │   ├── conftest.py
    │   ├── communities/          # TODO Sprint 1
    │   ├── messaging/            # TODO Sprint 2
    │   ├── cohorts/              # TODO Sprint 3
    │   └── ai_companion/         # TODO Sprint 5
    │
    └── docs/
        ├── architecture.md
        ├── erd.md
        ├── database-schema.md
        ├── api-contracts.md
        ├── migration-plan.md
        ├── local-dev.md
        ├── dependency-map.md
        └── folder-structure.md
```

## Boundary rules

| Layer | Location | Allowed imports |
|-------|----------|-----------------|
| Views | `api/v1/views/` | services, feature_flags, auth |
| WebSocket | `messaging/consumers.py` | messaging services only |
| Services | `{app}/services/` | repositories, analytics, other services |
| Repositories | `{app}/repositories.py` | models only |
| Models | `{app}/models.py` | Django ORM only |

## Status

- **Sprint 0 scaffold:** present (health endpoint, Docker, empty apps)
- **Business logic:** not implemented — awaiting approval
- **Migrations:** not generated — Sprint 1+
