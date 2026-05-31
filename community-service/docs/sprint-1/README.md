# Sprint 1 — Communities Service

**Status:** Approved with adjustments — planning complete, awaiting implementation go-ahead  
**Scope:** Organizations, communities, memberships, REST API, event hooks, tests  
**Out of scope:** WebSockets, messaging, cohorts, AI, notifications

---

## Approved adjustments summary

| # | Topic | Decision |
|---|-------|----------|
| 1 | Organizations | `organizations_organization` + indexed `organization_id` on major entities |
| 2 | DM channels | Explicit `channel_type` enum — deferred to Sprint 2; schema defined now |
| 3 | Dev auth | `JWT_DEV_BYPASS` local-only with startup guard + `AuthProviderInterface` |
| 4 | Event storage | `EventStorageProvider` — `LocalStorageProvider` + `S3StorageProvider` |
| 5 | Frontend | Isolated `/apps/community/` module — no onboarding coupling |
| 6 | Soft delete | `deleted_at` on mutable entities |
| 7 | Timestamps | `created_at`, `updated_at`, `deleted_at` |

---

## Sprint 1 deliverables (this folder)

| Doc | Purpose |
|-----|---------|
| [erd.md](erd.md) | Entity-relationship diagram |
| [migration-plan.md](migration-plan.md) | Migration order and rollback |
| [api-contracts.md](api-contracts.md) | REST endpoints for Sprint 1 |
| [folder-structure.md](folder-structure.md) | Files created in Sprint 1 |
| [index-strategy.md](index-strategy.md) | PostgreSQL indexes |
| [testing-strategy.md](testing-strategy.md) | Test pyramid and cases |

---

## Implementation gate

Do **not** start migrations/services/endpoints until explicit implementation approval.

After go-ahead, implement in order:

1. Migrations (`users` → `communities`)
2. Repositories
3. Services + event hooks
4. Serializers + views
5. Tests
6. Seed command stub
