# Sprint 1 — Testing Strategy

---

## Test pyramid

| Layer | Target | Sprint 1 focus |
|-------|--------|----------------|
| Unit | Services, repositories, auth providers | **Primary** |
| Integration | API + PostgreSQL | **Primary** |
| E2E | Frontend `/apps/community` | Optional stub |

**Runner:** `pytest` + `pytest-django`  
**Command:** `docker compose exec app pytest tests/communities/ -v`

---

## Test infrastructure

### `tests/conftest.py`

| Fixture | Purpose |
|---------|---------|
| `api_client` | DRF APIClient |
| `default_organization` | Seeded org from migration |
| `parent_user` | UserProfile factory, role=parent |
| `provider_user` | role=provider |
| `admin_user` | role=admin |
| `auth_headers(user)` | Dev JWT bypass token |
| `public_community` | Factory community, visibility=public |
| `private_community` | visibility=private |

### `tests/factories.py`

Use `factory-boy` for Organization, UserProfile, Community, CommunityMembership.

---

## Unit tests — models

**File:** `tests/communities/test_models.py`

| Test | Assert |
|------|--------|
| `test_soft_delete_excludes_from_default_manager` | deleted community not in `.objects.all()` |
| `test_active_membership_unique_constraint` | second join raises IntegrityError |
| `test_membership_leave_sets_left_at` | left_at populated, not deleted |
| `test_organization_slug_unique` | duplicate slug fails |

---

## Unit tests — auth

**File:** `tests/users/test_auth_provider.py`

| Test | Assert |
|------|--------|
| `test_dev_provider_parses_bypass_token` | returns AuthContext with role + user_id |
| `test_dev_bypass_fails_in_production_settings` | ImproperlyConfigured on startup |
| `test_invalid_token_returns_none` | 401 at middleware layer |

---

## Unit tests — services

**File:** `tests/communities/test_community_service.py`

| Test | Assert |
|------|--------|
| `test_create_community_sets_organization` | organization_id matches auth context |
| `test_create_emits_community_created` | emit_event called (mock) |
| `test_list_public_communities_excludes_private` | private not in results for non-member |
| `test_get_private_community_as_non_member_raises` | PermissionDenied or 403 path |
| `test_soft_deleted_community_not_found` | get returns None / NotFound |

**File:** `tests/communities/test_membership_service.py`

| Test | Assert |
|------|--------|
| `test_join_public_community` | membership created, role=member |
| `test_join_private_community_denied` | PermissionDenied |
| `test_join_twice_raises_conflict` | ConflictError / 409 |
| `test_leave_sets_left_at` | left_at set, can re-join later |
| `test_join_emits_community_joined` | emit_event mock |
| `test_leave_emits_community_left` | emit_event mock |

---

## Integration tests — API

**File:** `tests/communities/test_communities_api.py`

| Test | HTTP | Assert |
|------|------|--------|
| `test_health_ok` | GET /health/ | 200 |
| `test_create_community_as_admin` | POST /communities/ | 201 + body shape |
| `test_create_community_as_parent_denied` | POST /communities/ | 403 |
| `test_list_communities_paginated` | GET /communities/ | 200 + count |
| `test_get_community_detail_with_membership` | GET /communities/{id}/ | my_membership populated |
| `test_join_community` | POST .../join/ | 201 |
| `test_join_already_member` | POST .../join/ | 409 |
| `test_leave_community` | POST .../leave/ | 200 |
| `test_feature_flag_disabled` | any | 503 when ENABLE_COMMUNITIES=false |

---

## Event storage tests

**File:** `tests/analytics/test_local_storage.py`

| Test | Assert |
|------|--------|
| `test_local_provider_writes_partition_path` | file at `.data/events/community/event_type=.../` |
| `test_serializer_identical_local_and_s3` | same JSON schema |
| `test_emit_event_noop_when_storage_unconfigured` | does not raise in dev |

---

## Coverage targets (Sprint 1)

| Module | Target |
|--------|--------|
| `communities/services/` | ≥ 90% |
| `communities/repositories/` | ≥ 85% |
| `api/v1/views/communities.py` | ≥ 80% |
| `users/auth/` | ≥ 85% |

---

## CI (local only — no pipeline in Sprint 1)

```bash
docker compose exec app pytest --cov=communities --cov=users --cov-report=term-missing
docker compose exec app python manage.py check
docker compose exec app python manage.py migrate --plan
```

---

## Out of scope for Sprint 1 tests

- WebSocket consumers
- Cohort assignment
- AI provider
- Cognito integration (mocked via DevAuthProvider)
- Frontend component tests (optional follow-up)

---

## Test data seed

**Command:** `python manage.py seed_communities_demo` (implement end of Sprint 1)

Creates:
- 1 organization (if missing)
- 3 public communities with tags
- 1 private community
- 5 dev users with mixed memberships

Used for manual QA with `/apps/community`.
