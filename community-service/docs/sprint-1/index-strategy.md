# Sprint 1 — Index Strategy

All `organization_id` columns are indexed. Soft-delete queries use partial indexes where noted.

---

## `organizations_organization`

| Index name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `org_slug_unique` | `(slug)` | UNIQUE | Lookup by slug |
| `org_active_idx` | `(id)` WHERE `deleted_at IS NULL` | PARTIAL | Active org queries |

---

## `users_userprofile`

| Index name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `user_cognito_sub_unique` | `(cognito_sub)` | UNIQUE | Auth lookup |
| `user_org_idx` | `(organization_id)` | BTREE | Tenant scoping |
| `user_org_role_idx` | `(organization_id, platform_role)` | BTREE | Admin lists |
| `user_active_idx` | `(organization_id, id)` WHERE `deleted_at IS NULL` | PARTIAL | Active users |

---

## `communities_community`

| Index name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `community_org_idx` | `(organization_id)` | BTREE | Tenant scoping |
| `community_org_visibility_idx` | `(organization_id, visibility)` WHERE `deleted_at IS NULL` | PARTIAL | Public discovery |
| `community_tags_gin` | `(tags)` | GIN | Tag filter `?tag=` |
| `community_created_by_idx` | `(created_by_id)` | BTREE | Creator lookup |
| `community_active_idx` | `(organization_id, created_at DESC)` WHERE `deleted_at IS NULL` | PARTIAL | List pagination |

---

## `communities_membership`

| Index name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `membership_user_community_active_uniq` | `(user_id, community_id)` WHERE `left_at IS NULL AND deleted_at IS NULL` | UNIQUE PARTIAL | One active membership |
| `mbr_cmty_active_idx` | `(community_id, joined_at DESC)` WHERE `left_at IS NULL AND deleted_at IS NULL` | PARTIAL | Member list + count |
| `membership_user_active_idx` | `(user_id, joined_at DESC)` WHERE `left_at IS NULL AND deleted_at IS NULL` | PARTIAL | User's communities |
| `membership_org_idx` | `(organization_id)` | BTREE | Tenant scoping |

---

## Sprint 2 preview — `messaging_channel`

| Index name | Columns | Purpose |
|------------|---------|---------|
| `channel_type_participant_hash_idx` | `(channel_type, participant_hash)` | DM dedup lookup |
| `channel_community_idx` | `(community_id)` WHERE `channel_type = 'COMMUNITY'` | Community channels |
| `channel_org_idx` | `(organization_id)` | Tenant scoping |

---

## Query patterns → index mapping

| Query | Index used |
|-------|------------|
| List public communities | `community_org_visibility_idx` |
| Filter by tag | `community_tags_gin` |
| Count members | `mbr_cmty_active_idx` |
| Check active membership | `membership_user_community_active_uniq` |
| Auth user lookup | `user_cognito_sub_unique` |
| User's communities | `membership_user_active_idx` |

---

## Django migration example

```python
class Migration(migrations.Migration):
    operations = [
        migrations.AddIndex(
            model_name="community",
            index=models.Index(
                fields=["organization_id", "visibility"],
                name="community_org_visibility_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(
                fields=["tags"],
                name="community_tags_gin",
                opclasses=["jsonb_path_ops"],
            ),
        ),
    ]
```

---

## Maintenance notes

- Reindex GIN if tag cardinality grows large (monitor in Sprint 6+).
- Partial indexes require PostgreSQL — aligned with approved stack.
- Avoid over-indexing `profile_metadata` JSONB in Sprint 1; cohort queries come Sprint 3.
