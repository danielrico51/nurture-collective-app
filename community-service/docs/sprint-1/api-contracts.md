# Sprint 1 — API Contracts

**Base URL:** `/api/v1/`  
**Auth:** `Authorization: Bearer <token>` via `AuthProviderInterface`  
**Feature flag:** `ENABLE_COMMUNITIES=true` (else `503`)

---

## Auth

### Dev bypass (local only)

When `JWT_DEV_BYPASS=true` and `DJANGO_DEBUG=true`:

```
Authorization: Bearer dev:parent:{uuid}
Authorization: Bearer dev:provider:{uuid}
Authorization: Bearer dev:admin:{uuid}
```

**Startup guard:** if `JWT_DEV_BYPASS=true` and not local/dev → `ImproperlyConfigured`, process exits.

### Production

`CognitoAuthProvider` validates JWT (TODO — Sprint 1 implements interface + dev provider only).

---

## Common response shapes

### Success list

```json
{
  "count": 12,
  "next": "/api/v1/communities/?page=2",
  "previous": null,
  "results": []
}
```

### Error

```json
{
  "error": "Human-readable message",
  "code": "ALREADY_MEMBER",
  "details": {}
}
```

| HTTP | When |
|------|------|
| 400 | Validation |
| 401 | Missing/invalid auth |
| 403 | RBAC / visibility |
| 404 | Not found or soft-deleted |
| 409 | Duplicate active membership |
| 503 | `ENABLE_COMMUNITIES=false` |

---

## Endpoints

### `GET /health/`

Unauthenticated.

```json
{ "status": "ok", "service": "community-service", "version": "0.1.0" }
```

---

### `POST /communities/`

**Roles:** `admin`, `provider` (providers need `ENABLE_COMMUNITY_CREATE` flag — default true in dev)

**Request**
```json
{
  "name": "Northern NJ Postpartum Circle",
  "description": "Peer support for new moms",
  "visibility": "public",
  "tags": ["postpartum", "northern-nj"]
}
```

**Response `201`**
```json
{
  "community_id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "...",
  "name": "Northern NJ Postpartum Circle",
  "description": "Peer support for new moms",
  "visibility": "public",
  "tags": ["postpartum", "northern-nj"],
  "member_count": 0,
  "created_at": "2026-05-31T14:00:00Z",
  "updated_at": "2026-05-31T14:00:00Z"
}
```

**Emits:** `community_created`

---

### `GET /communities/`

**Roles:** any authenticated user

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `visibility` | string | Filter: `public`, `private`, `invite_only` |
| `tag` | string | Match tag in JSONB array |
| `page` | int | Default 1 |
| `page_size` | int | Default 20, max 100 |

**Response `200`**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "community_id": "...",
      "organization_id": "...",
      "name": "Pregnancy Circle",
      "description": "...",
      "visibility": "public",
      "tags": ["pregnancy"],
      "member_count": 24
    }
  ]
}
```

**Rules:** Lists non-deleted communities. Private communities visible only to members (filter in service layer).

---

### `GET /communities/{community_id}/`

**Response `200`**
```json
{
  "community_id": "...",
  "organization_id": "...",
  "name": "...",
  "description": "...",
  "visibility": "public",
  "tags": [],
  "member_count": 48,
  "created_at": "...",
  "updated_at": "...",
  "my_membership": {
    "membership_id": "...",
    "role": "member",
    "joined_at": "2026-05-31T14:00:00Z"
  }
}
```

`my_membership` is `null` if caller is not an active member.

---

### `POST /communities/{community_id}/join/`

**Request:** `{}`

**Response `201`**
```json
{
  "membership_id": "...",
  "community_id": "...",
  "user_id": "...",
  "organization_id": "...",
  "role": "member",
  "joined_at": "2026-05-31T14:00:00Z"
}
```

**Errors**
- `403` — private/invite_only without access
- `404` — community not found or deleted
- `409` — already an active member

**Emits:** `community_joined`

---

### `POST /communities/{community_id}/leave/`

**Response `200`**
```json
{
  "community_id": "...",
  "left_at": "2026-05-31T14:30:00Z"
}
```

Sets `left_at` on membership (soft leave, not hard delete).

**Emits:** `community_left`

---

## Event hook payloads (Sprint 1)

Called via `emit_event()` — storage backend may no-op until Sprint 4 wiring.

### `community_created`

```json
{
  "event_type": "community_created",
  "domain": "community",
  "organization_id": "uuid",
  "user_id": "uuid",
  "properties": {
    "community_id": "uuid",
    "visibility": "public",
    "tags": []
  }
}
```

### `community_joined` / `community_left`

```json
{
  "event_type": "community_joined",
  "domain": "community",
  "organization_id": "uuid",
  "user_id": "uuid",
  "properties": {
    "community_id": "uuid",
    "membership_id": "uuid",
    "role": "member"
  }
}
```

---

## Serializers (typed)

| Serializer | Fields |
|------------|--------|
| `CommunityCreateSerializer` | name, description, visibility, tags |
| `CommunityListSerializer` | community_id, organization_id, name, description, visibility, tags, member_count |
| `CommunityDetailSerializer` | above + created_at, updated_at, my_membership |
| `MembershipSerializer` | membership_id, community_id, user_id, organization_id, role, joined_at |

Validation in serializers; authorization in services.

---

## Frontend integration (`/apps/community`)

| Frontend call | Backend |
|---------------|---------|
| List communities | `GET /api/v1/communities/` |
| Community detail | `GET /api/v1/communities/{id}/` |
| Join | `POST /api/v1/communities/{id}/join/` |
| Leave | `POST /api/v1/communities/{id}/leave/` |

Frontend module: `src/app/(site)/apps/community/` — isolated services/hooks; no direct imports from onboarding.
