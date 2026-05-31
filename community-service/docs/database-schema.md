# Community Service — Database Schema

**Engine:** PostgreSQL 16  
**ORM:** Django 5.x  
**Convention:** UUID primary keys, `TIMESTAMPTZ`, soft deletes where noted

---

## Global conventions

- All tables include `organization_id UUID NOT NULL` (default org seeded in migration 0001)
- `created_at` / `updated_at` on mutable entities
- Indexes named `{table}_{columns}_idx`
- FK `ON DELETE` — communities/cohorts: RESTRICT; memberships/messages: CASCADE where safe

---

## `organizations_organization`

Multi-tenant root (Phase 1: single default org).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `name` | VARCHAR(255) | NOT NULL |
| `slug` | VARCHAR(64) | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() |

**Seed:** `slug=nurture-collective`, `name=Nurture Collective LLC`

---

## `users_userprofile`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations, NOT NULL |
| `cognito_sub` | VARCHAR(128) | UNIQUE, NOT NULL |
| `platform_role` | VARCHAR(16) | NOT NULL — `parent`, `provider`, `admin` |
| `display_name` | VARCHAR(255) | NULL |
| `profile_metadata` | JSONB | NOT NULL, default `{}` |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

**Indexes:** `(organization_id)`, `(cognito_sub)`

**profile_metadata keys (cohort assignment inputs):**
```json
{
  "due_date": "2026-08-15",
  "postpartum_weeks": 6,
  "newborn_age_days": 14,
  "location_zip": "07601"
}
```

---

## `communities_community`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK — exposed as `community_id` |
| `organization_id` | UUID | FK, NOT NULL |
| `name` | VARCHAR(200) | NOT NULL |
| `description` | TEXT | NOT NULL, default '' |
| `visibility` | VARCHAR(16) | NOT NULL — `public`, `private`, `invite_only` |
| `tags` | JSONB | NOT NULL, default `[]` |
| `created_by_id` | UUID | FK → users_userprofile, NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

**Indexes:** `(organization_id, visibility)`, GIN `(tags)`

---

## `communities_membership`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK, NOT NULL |
| `user_id` | UUID | FK → users_userprofile, NOT NULL |
| `community_id` | UUID | FK → communities_community, NOT NULL |
| `role` | VARCHAR(16) | NOT NULL — `member`, `moderator`, `owner` |
| `joined_at` | TIMESTAMPTZ | NOT NULL |
| `left_at` | TIMESTAMPTZ | NULL |

**Partial unique:** `(user_id, community_id) WHERE left_at IS NULL`

**Indexes:** `(community_id, left_at)`, `(user_id, left_at)`

---

## `cohorts_cohort`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK, NOT NULL |
| `cohort_type` | VARCHAR(16) | NOT NULL — `pregnancy`, `newborn`, `postpartum` |
| `name` | VARCHAR(200) | NOT NULL |
| `description` | TEXT | NOT NULL, default '' |
| `linked_community_id` | UUID | FK → communities_community, NULL |
| `window_start` | DATE | NULL |
| `window_end` | DATE | NULL |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Indexes:** `(organization_id, cohort_type, is_active)`

*No `assignment_rules` JSONB — hard-coded logic in services.*

---

## `cohorts_membership`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK, NOT NULL |
| `user_id` | UUID | FK, NOT NULL |
| `cohort_id` | UUID | FK → cohorts_cohort, NOT NULL |
| `source` | VARCHAR(16) | NOT NULL — `auto`, `manual`, `recommended` |
| `assigned_at` | TIMESTAMPTZ | NOT NULL |
| `expires_at` | TIMESTAMPTZ | NULL |

**Unique:** `(user_id, cohort_id)`

---

## `messaging_channel`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK — exposed as `channel_id` |
| `organization_id` | UUID | FK, NOT NULL |
| `community_id` | UUID | FK → communities_community, NULL (NULL for DMs) |
| `channel_type` | VARCHAR(16) | NOT NULL — `group`, `direct`, `announcement` |
| `name` | VARCHAR(200) | NOT NULL |
| `metadata` | JSONB | NOT NULL, default `{}` |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**DM metadata example:**
```json
{ "participant_hash": "uuid_a:uuid_b", "participants": ["uuid_a", "uuid_b"] }
```

**Indexes:** `(community_id)`, `(organization_id, channel_type)`

---

## `messaging_channelmember`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `channel_id` | UUID | FK → messaging_channel, NOT NULL |
| `user_id` | UUID | FK → users_userprofile, NOT NULL |
| `last_read_at` | TIMESTAMPTZ | NULL |
| `joined_at` | TIMESTAMPTZ | NOT NULL |

**Unique:** `(channel_id, user_id)`

---

## `messaging_message`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK — exposed as `message_id` |
| `organization_id` | UUID | FK, NOT NULL |
| `channel_id` | UUID | FK → messaging_channel, NOT NULL |
| `sender_id` | UUID | FK → users_userprofile, NOT NULL |
| `body` | TEXT | NOT NULL |
| `metadata` | JSONB | NOT NULL, default `{}` |
| `moderation_status` | VARCHAR(16) | NOT NULL, default `visible` |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `edited_at` | TIMESTAMPTZ | NULL |

**Indexes:** `(channel_id, created_at DESC)`, `(sender_id, created_at DESC)`

---

## `ai_companion_promptversion`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `prompt_key` | VARCHAR(64) | NOT NULL |
| `version` | INTEGER | NOT NULL |
| `template` | TEXT | NOT NULL |
| `variables_schema` | JSONB | NOT NULL, default `{}` |
| `is_active` | BOOLEAN | NOT NULL, default false |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Unique:** `(prompt_key, version)`

---

## `ai_companion_conversation`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK, NOT NULL |
| `user_id` | UUID | FK, NOT NULL |
| `conversation_type` | VARCHAR(16) | NOT NULL |
| `context_snapshot` | JSONB | NOT NULL, default `{}` |
| `started_at` | TIMESTAMPTZ | NOT NULL |
| `ended_at` | TIMESTAMPTZ | NULL |

---

## `ai_companion_message`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `conversation_id` | UUID | FK, NOT NULL |
| `role` | VARCHAR(16) | NOT NULL — `user`, `assistant`, `system` |
| `content` | TEXT | NOT NULL |
| `prompt_version_id` | UUID | FK → promptversion, NULL |
| `safety_flags` | JSONB | NOT NULL, default `{}` |
| `created_at` | TIMESTAMPTZ | NOT NULL |

**Indexes:** `(conversation_id, created_at)`

---

## Django migration numbering

| Migration | App | Contents |
|-----------|-----|----------|
| `0001_initial` | `users` | Organization + UserProfile + default org seed |
| `0001_initial` | `communities` | Community + Membership |
| `0001_initial` | `messaging` | Channel + ChannelMember + Message |
| `0001_initial` | `cohorts` | Cohort + CohortMembership |
| `0001_initial` | `ai_companion` | PromptVersion + Conversation + Message |

Run order: `users` → `communities` → `messaging` → `cohorts` → `ai_companion`

---

## Seed data (Sprint 1+)

| Entity | Count | Examples |
|--------|-------|----------|
| Organization | 1 | Nurture Collective |
| Communities | 3 | Pregnancy Circle, Newborn Parents, Postpartum Support |
| Cohorts | 6 | 2 per cohort_type with date windows |
| Prompt versions | 4 | daily_checkin, qa, resources, escalation v1 |

Command: `python manage.py seed_community_demo` (implement Sprint 5)
