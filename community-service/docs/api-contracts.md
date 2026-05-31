# Community Service — API Contracts

**Base URL:** `/api/v1/`  
**Auth:** `Authorization: Bearer <Cognito JWT>`  
**Content-Type:** `application/json`  
**Errors:** RFC 7807-style JSON `{ "error": "...", "code": "...", "details": {} }`

---

## Common types

```typescript
type UUID = string;
type ISODateTime = string;

type PlatformRole = "parent" | "provider" | "admin";
type CommunityVisibility = "public" | "private" | "invite_only";
type CommunityRole = "member" | "moderator" | "owner";
type CohortType = "pregnancy" | "newborn" | "postpartum";
type ChannelType = "group" | "direct" | "announcement";
type ModerationStatus = "visible" | "flagged" | "removed";
```

---

## Health

### `GET /health/`

**Response `200`**
```json
{ "status": "ok", "service": "community-service", "version": "0.1.0" }
```

---

## Communities

*Gated by `ENABLE_COMMUNITIES`*

### `POST /communities/`

**Auth:** admin, or provider with create permission  
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

**Query:** `visibility`, `tag`, `page`, `page_size` (default 20, max 100)

**Response `200`**
```json
{
  "count": 12,
  "next": "/api/v1/communities/?page=2",
  "previous": null,
  "results": [
    {
      "community_id": "...",
      "name": "...",
      "description": "...",
      "visibility": "public",
      "tags": [],
      "member_count": 48
    }
  ]
}
```

---

### `GET /communities/{community_id}/`

**Response `200`**
```json
{
  "community_id": "...",
  "name": "...",
  "description": "...",
  "visibility": "public",
  "tags": [],
  "member_count": 48,
  "my_membership": {
    "role": "member",
    "joined_at": "2026-05-31T14:00:00Z"
  }
}
```

---

### `POST /communities/{community_id}/join/`

**Request:** `{}`

**Response `201`**
```json
{
  "membership_id": "...",
  "community_id": "...",
  "user_id": "...",
  "role": "member",
  "joined_at": "2026-05-31T14:00:00Z"
}
```
**Errors:** `403` (private/invite), `409` (already member)  
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
**Emits:** `community_left`

---

## Messaging

*Gated by `ENABLE_GROUP_CHAT`*

### `GET /channels/`

**Query:** `community_id`, `channel_type`, `page`

**Response `200`**
```json
{
  "results": [
    {
      "channel_id": "...",
      "channel_type": "group",
      "community_id": "...",
      "name": "General",
      "unread_count": 3,
      "last_message_at": "2026-05-31T14:00:00Z"
    }
  ]
}
```

---

### `POST /channels/`

**Group channel**
```json
{
  "channel_type": "group",
  "community_id": "...",
  "name": "General"
}
```

**Direct message**
```json
{
  "channel_type": "direct",
  "participant_ids": ["other-user-uuid"]
}
```

**Response `201`**
```json
{
  "channel_id": "...",
  "channel_type": "direct",
  "name": "DM",
  "metadata": { "participants": ["...", "..."] },
  "created_at": "2026-05-31T14:00:00Z"
}
```

---

### `GET /channels/{channel_id}/messages/`

**Query:** `cursor` (message_id), `limit` (default 50, max 100)

**Response `200`**
```json
{
  "messages": [
    {
      "message_id": "...",
      "sender_id": "...",
      "channel_id": "...",
      "message": "Hello!",
      "timestamp": "2026-05-31T14:00:00Z",
      "metadata": {},
      "moderation_status": "visible"
    }
  ],
  "next_cursor": "..."
}
```

---

### `POST /channels/{channel_id}/messages/`

**Request**
```json
{
  "message": "Hello everyone!",
  "metadata": {}
}
```

**Response `201`**
```json
{
  "message_id": "...",
  "sender_id": "...",
  "channel_id": "...",
  "message": "Hello everyone!",
  "timestamp": "2026-05-31T14:00:01Z",
  "metadata": {}
}
```
**Emits:** `message_sent`  
**Hooks:** `before_message_send()` → may return `403` if blocked (Phase 1: always allow)

---

### `POST /channels/{channel_id}/read/`

**Request**
```json
{
  "read_at": "2026-05-31T14:05:00Z",
  "message_id": "..."
}
```

**Response `200`**
```json
{ "channel_id": "...", "last_read_at": "2026-05-31T14:05:00Z" }
```
**Emits:** `message_read`

---

## WebSocket — Messaging

**URL:** `ws://host/ws/messaging/{channel_id}/?token=<jwt>`

### Client → Server

```json
{ "type": "message.send", "body": "Hello", "metadata": {} }
{ "type": "typing.start" }
{ "type": "typing.stop" }
{ "type": "read.receipt", "message_id": "..." }
{ "type": "presence.ping" }
```

### Server → Client

```json
{ "type": "message.new", "payload": { "message_id": "...", "sender_id": "...", "message": "...", "timestamp": "..." } }
{ "type": "typing", "payload": { "user_id": "...", "state": "start" } }
{ "type": "read.updated", "payload": { "user_id": "...", "last_read_at": "..." } }
{ "type": "presence", "payload": { "user_id": "...", "state": "online" } }
{ "type": "error", "payload": { "code": "FORBIDDEN", "message": "..." } }
```

Transport delegates to `MessageService` — consumers contain no business logic.

---

## Cohorts

*Gated by `ENABLE_COHORTS`*

### `GET /cohorts/`

**Query:** `cohort_type`, `is_active`

**Response `200`**
```json
{
  "results": [
    {
      "cohort_id": "...",
      "cohort_type": "pregnancy",
      "name": "Due June 2026",
      "window_start": "2026-06-01",
      "window_end": "2026-06-30",
      "linked_community_id": "..."
    }
  ]
}
```

---

### `GET /cohorts/recommendations/`

**Response `200`**
```json
{
  "recommendations": [
    {
      "cohort_id": "...",
      "cohort_type": "postpartum",
      "name": "First 12 Weeks Postpartum",
      "score": 1.0,
      "reason": "postpartum_weeks within window"
    }
  ]
}
```

---

### `POST /cohorts/{cohort_id}/join/`

**Response `201`** — manual join  
**Emits:** `cohort_assigned` (source: `manual`)

---

### `POST /cohorts/assign/`

Re-runnable auto-assignment (admin or internal hook).

**Request**
```json
{ "user_id": "...", "force_refresh": false }
```

**Response `200`**
```json
{
  "assigned": [
    {
      "cohort_id": "...",
      "cohort_type": "pregnancy",
      "source": "auto",
      "linked_community_id": "..."
    }
  ]
}
```
**Emits:** `cohort_assigned` per new assignment

---

## AI Companion

*Gated by `ENABLE_AI`*

### `POST /ai/checkin/`

**Response `200`**
```json
{
  "conversation_id": "...",
  "prompt_version": "daily_checkin_v1",
  "message": "How are you feeling today?",
  "safety_passed": true
}
```

---

### `POST /ai/ask/`

**Request**
```json
{
  "question": "Is it normal to feel overwhelmed at 2 weeks postpartum?",
  "conversation_id": "..."
}
```

**Response `200`**
```json
{
  "conversation_id": "...",
  "message": "...",
  "safety_passed": true,
  "escalation_recommended": false
}
```
**Emits:** `ai_question_asked`

---

### `POST /ai/recommend/`

**Request**
```json
{ "topic": "breastfeeding", "conversation_id": "..." }
```

---

### `POST /ai/escalate/`

**Request**
```json
{
  "conversation_id": "...",
  "reason": "User expressed urgent distress",
  "urgency": "high"
}
```

**Response `202`**
```json
{
  "escalation_id": "...",
  "status": "queued",
  "message": "A care coordinator will follow up."
}
```

---

## Event payload schema (S3)

All events written by `emit_event()`:

```json
{
  "event_id": "uuid",
  "event_type": "community_joined",
  "domain": "community",
  "organization_id": "uuid",
  "user_id": "uuid",
  "occurred_at": "2026-05-31T14:00:00Z",
  "properties": {
    "community_id": "uuid"
  },
  "schema_version": 1
}
```

**S3 key:**
```
{domain}/event_type={event_type}/year={Y}/month={M}/day={D}/hour={H}/{event_id}.json
```

---

## HTTP status summary

| Code | Usage |
|------|-------|
| `200` | Success |
| `201` | Created |
| `202` | Accepted (escalation queued) |
| `400` | Validation error |
| `401` | Missing/invalid JWT |
| `403` | RBAC or moderation block |
| `404` | Not found |
| `409` | Conflict (duplicate membership) |
| `503` | Feature flag disabled |
