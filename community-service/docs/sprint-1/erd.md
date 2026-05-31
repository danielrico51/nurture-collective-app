# Sprint 1 — ERD

Sprint 1 implements **organizations**, **user profiles**, **communities**, and **memberships** only.

Channel model is **defined** for Sprint 2 alignment but **not migrated** in Sprint 1.

---

## Sprint 1 entities

```mermaid
erDiagram
  ORGANIZATION ||--o{ USER_PROFILE : employs
  ORGANIZATION ||--o{ COMMUNITY : owns
  ORGANIZATION ||--o{ COMMUNITY_MEMBERSHIP : scopes

  USER_PROFILE ||--o{ COMMUNITY_MEMBERSHIP : has
  USER_PROFILE ||--o{ COMMUNITY : creates
  COMMUNITY ||--o{ COMMUNITY_MEMBERSHIP : has

  ORGANIZATION {
    uuid id PK
    string name
    string slug UK
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  USER_PROFILE {
    uuid id PK
    uuid organization_id FK
    string cognito_sub UK
    enum platform_role "parent|provider|admin"
    string display_name
    jsonb profile_metadata
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  COMMUNITY {
    uuid id PK
    uuid organization_id FK
    string name
    text description
    enum visibility "public|private|invite_only"
    jsonb tags
    uuid created_by_id FK
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  COMMUNITY_MEMBERSHIP {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    uuid community_id FK
    enum role "member|moderator|owner"
    timestamptz joined_at
    timestamptz left_at
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }
```

---

## Sprint 2 preview (not built in Sprint 1)

Explicit channel types per approved adjustment:

```mermaid
erDiagram
  CHANNEL {
    uuid id PK
    uuid organization_id FK
    enum channel_type "COMMUNITY|DIRECT|GROUP"
    uuid community_id FK "nullable"
    string participant_hash "nullable"
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }
```

| channel_type | community_id | participant_hash |
|--------------|--------------|------------------|
| `COMMUNITY` | **required** | NULL |
| `DIRECT` | nullable | **required** (sorted UUID pair) |
| `GROUP` | nullable | optional |

---

## Relationship rules

- Every row carries `organization_id` (indexed).
- `COMMUNITY.created_by_id` → `USER_PROFILE` (nullable for seeded communities).
- Active membership: `left_at IS NULL AND deleted_at IS NULL`.
- Soft delete: set `deleted_at`; do not hard-delete memberships in Sprint 1.

---

## Event entities (not relational)

Events emitted to storage backend (Sprint 1 hooks call `emit_event`; full storage Sprint 4):

```
community/event_type=community_created/...
community/event_type=community_joined/...
community/event_type=community_left/...
```

Each event payload includes `organization_id`.
