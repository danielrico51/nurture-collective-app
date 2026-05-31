# Sprint 1 — Migration Plan

---

## Migration sequence

| Order | App | File | Contents |
|-------|-----|------|----------|
| 1 | `users` | `0001_initial.py` | `Organization`, `UserProfile` |
| 2 | `users` | `0002_seed_default_organization.py` | RunPython: default org |
| 3 | `communities` | `0001_initial.py` | `Community`, `CommunityMembership` |

**Dependency:** `communities` depends on `users` (FK to `UserProfile`, `Organization`).

---

## Migration 0001 — users

### `organizations_organization`

```python
id              UUID PK default gen_random_uuid()
name            VARCHAR(255) NOT NULL
slug            VARCHAR(64) NOT NULL UNIQUE
created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

**Indexes:** `(slug)` UNIQUE, `(deleted_at)` partial WHERE deleted_at IS NULL

### `users_userprofile`

```python
id                  UUID PK
organization_id     UUID FK → organizations NOT NULL
cognito_sub         VARCHAR(128) NOT NULL UNIQUE
platform_role       VARCHAR(16) NOT NULL  # parent|provider|admin
display_name        VARCHAR(255) NULL
profile_metadata    JSONB NOT NULL DEFAULT '{}'
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

**Indexes:** see [index-strategy.md](index-strategy.md)

---

## Migration 0002 — seed default organization

```python
Organization.objects.get_or_create(
    slug="nurture-collective",
    defaults={"name": "Nurture Collective LLC"},
)
```

All Sprint 1 requests default to this org until multi-org routing exists.

---

## Migration 0001 — communities

### `communities_community`

```python
id                  UUID PK
organization_id     UUID FK NOT NULL
name                VARCHAR(200) NOT NULL
description         TEXT NOT NULL DEFAULT ''
visibility          VARCHAR(16) NOT NULL  # public|private|invite_only
tags                JSONB NOT NULL DEFAULT '[]'
created_by_id       UUID FK → users_userprofile NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

### `communities_membership`

```python
id                  UUID PK
organization_id     UUID FK NOT NULL
user_id             UUID FK → users_userprofile NOT NULL
community_id        UUID FK → communities_community NOT NULL
role                VARCHAR(16) NOT NULL  # member|moderator|owner
joined_at           TIMESTAMPTZ NOT NULL
left_at             TIMESTAMPTZ NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

**Constraints:**
- Partial unique: `(user_id, community_id) WHERE left_at IS NULL AND deleted_at IS NULL`

---

## Django model base mixin

All Sprint 1 models inherit:

```python
class TimestampedSoftDeleteModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True
```

Querysets default to `.filter(deleted_at__isnull=True)` via custom `SoftDeleteManager`.

---

## Rollback

| Action | Command |
|--------|---------|
| Rollback communities | `migrate communities zero` |
| Rollback users | `migrate users zero` |

Safe in local dev only. Production rollback requires runbook (out of Sprint 1 scope).

---

## Post-migration verification

```bash
docker compose exec app python manage.py migrate --plan
docker compose exec app python manage.py showmigrations users communities
docker compose exec app python manage.py dbshell  # \dt, \di
```

---

## Not in Sprint 1 migrations

- `messaging_channel` (Sprint 2 — uses explicit `COMMUNITY|DIRECT|GROUP`)
- `cohorts_*` (Sprint 3)
- `ai_companion_*` (Sprint 5)
