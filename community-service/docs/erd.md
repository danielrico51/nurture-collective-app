# Community Service — ERD

All operational entities live in **PostgreSQL**. Analytics history in **S3** (not shown as entities).

---

## Full ERD

```mermaid
erDiagram
  ORGANIZATION ||--o{ COMMUNITY : owns
  ORGANIZATION ||--o{ COHORT : owns

  USER_PROFILE ||--o{ COMMUNITY_MEMBERSHIP : has
  COMMUNITY ||--o{ COMMUNITY_MEMBERSHIP : has
  COMMUNITY ||--o{ CHANNEL : contains

  USER_PROFILE ||--o{ COHORT_MEMBERSHIP : has
  COHORT ||--o{ COHORT_MEMBERSHIP : has
  COHORT ||--o| COMMUNITY : "linked_community"

  CHANNEL ||--o{ CHANNEL_MEMBER : has
  USER_PROFILE ||--o{ CHANNEL_MEMBER : has
  CHANNEL ||--o{ MESSAGE : contains
  USER_PROFILE ||--o{ MESSAGE : sends

  USER_PROFILE ||--o{ AI_CONVERSATION : has
  AI_CONVERSATION ||--o{ AI_MESSAGE : contains
  AI_PROMPT_VERSION ||--o{ AI_MESSAGE : "prompt_version"

  ORGANIZATION {
    uuid id PK
    string name
    string slug UK
    datetime created_at
  }

  USER_PROFILE {
    uuid id PK
    uuid organization_id FK
    string cognito_sub UK
    enum platform_role "parent|provider|admin"
    string display_name
    jsonb profile_metadata
    datetime created_at
    datetime updated_at
  }

  COMMUNITY {
    uuid id PK
    uuid organization_id FK
    string name
    text description
    enum visibility "public|private|invite_only"
    jsonb tags
    uuid created_by_id FK
    datetime created_at
    datetime updated_at
  }

  COMMUNITY_MEMBERSHIP {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    uuid community_id FK
    enum role "member|moderator|owner"
    datetime joined_at
    datetime left_at
  }

  COHORT {
    uuid id PK
    uuid organization_id FK
    enum cohort_type "pregnancy|newborn|postpartum"
    string name
    text description
    uuid linked_community_id FK
    date window_start
    date window_end
    boolean is_active
    datetime created_at
  }

  COHORT_MEMBERSHIP {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    uuid cohort_id FK
    enum source "auto|manual|recommended"
    datetime assigned_at
    datetime expires_at
  }

  CHANNEL {
    uuid id PK
    uuid organization_id FK
    uuid community_id FK
    enum channel_type "group|direct|announcement"
    string name
    jsonb metadata
    datetime created_at
  }

  CHANNEL_MEMBER {
    uuid id PK
    uuid channel_id FK
    uuid user_id FK
    datetime last_read_at
    datetime joined_at
  }

  MESSAGE {
    uuid id PK
    uuid organization_id FK
    uuid channel_id FK
    uuid sender_id FK
    text body
    jsonb metadata
    enum moderation_status "visible|flagged|removed"
    datetime created_at
    datetime edited_at
  }

  AI_CONVERSATION {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    enum conversation_type "checkin|qa|resource|escalation"
    jsonb context_snapshot
    datetime started_at
    datetime ended_at
  }

  AI_MESSAGE {
    uuid id PK
    uuid conversation_id FK
    enum role "user|assistant|system"
    text content
    uuid prompt_version_id FK
    jsonb safety_flags
    datetime created_at
  }

  AI_PROMPT_VERSION {
    uuid id PK
    string prompt_key
    int version
    text template
    jsonb variables_schema
    boolean is_active
    datetime created_at
  }
```

---

## Relationship notes

| Relationship | Cardinality | Notes |
|--------------|-------------|-------|
| User ↔ Community | M:N | Via `COMMUNITY_MEMBERSHIP`; soft leave via `left_at` |
| User ↔ Cohort | M:N | Multiple cohorts allowed |
| Community ↔ Channel | 1:N | DMs have `community_id = NULL` |
| Channel ↔ Message | 1:N | Paginated by `(channel_id, created_at)` |
| Cohort ↔ Community | N:1 | Optional linked community for auto-join |
| Organization ↔ * | 1:N | Multi-tenant prep on all major tables |

---

## S3 event flow (logical, not relational)

```mermaid
flowchart LR
  SVC[Service action] --> EMIT[emit_event]
  EMIT --> S3[(NURTURE_EVENTS_BUCKET)]
  S3 --> P1[community/event_type=...]
  S3 --> P2[messaging/event_type=...]
  S3 --> P3[cohorts/event_type=...]
  S3 --> P4[analytics/event_type=...]
```
