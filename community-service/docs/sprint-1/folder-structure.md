# Sprint 1 — Folder Structure

Files **created or modified** during Sprint 1 implementation.

---

## Backend (`community-service/`)

```
community-service/
├── users/
│   ├── models.py                 # Organization, UserProfile + SoftDeleteMixin
│   ├── managers.py               # SoftDeleteManager
│   ├── repositories.py           # OrganizationRepository, UserProfileRepository
│   ├── services/
│   │   └── profile_service.py    # get_or_create_from_auth()
│   ├── auth/
│   │   ├── base.py               # AuthProviderInterface
│   │   ├── dev_provider.py       # DevAuthProvider (JWT_DEV_BYPASS)
│   │   └── cognito_provider.py   # Stub — TODO shared/auth
│   ├── middleware.py             # AuthMiddleware
│   └── migrations/
│       ├── 0001_initial.py
│       └── 0002_seed_default_organization.py
│
├── communities/
│   ├── models.py                 # Community, CommunityMembership
│   ├── repositories.py           # CommunityRepository, MembershipRepository
│   ├── services/
│   │   ├── community_service.py  # create, list, get
│   │   └── membership_service.py # join, leave
│   ├── serializers.py
│   ├── selectors.py              # list queries with visibility filters
│   └── migrations/
│       └── 0001_initial.py
│
├── analytics/
│   ├── emitter.py                # emit_event() — calls storage provider
│   ├── events.py                 # CommunityEvent dataclass + event types
│   └── storage/
│       ├── base.py               # EventStorageProvider protocol
│       ├── local_provider.py     # .data/events/ mirror
│       └── s3_provider.py        # S3 stub (full impl Sprint 4)
│
├── api/v1/
│   ├── urls.py                   # Sprint 1 community routes
│   └── views/
│       └── communities.py        # thin views
│
├── infrastructure/
│   └── feature_flags.py          # ENABLE_COMMUNITIES
│
├── tests/
│   ├── factories.py              # Organization, User, Community factories
│   ├── conftest.py               # auth fixtures, api client
│   └── communities/
│       ├── test_models.py
│       ├── test_community_service.py
│       ├── test_membership_service.py
│       └── test_communities_api.py
│
└── docs/sprint-1/                # This folder
```

---

## Frontend (`src/app/(site)/apps/community/`)

Isolated module — **Sprint 1 frontend wiring optional**; structure approved now:

```
src/app/(site)/apps/community/
├── page.tsx                      # Community hub (existing — extend)
├── components/
│   ├── CommunityList.tsx
│   ├── CommunityCard.tsx
│   └── JoinLeaveButton.tsx
├── hooks/
│   ├── useCommunities.ts
│   └── useCommunityMembership.ts
├── services/
│   └── communityApi.ts           # fetch wrapper → community-service
└── types/
    └── community.ts              # mirrors API contracts
```

**Rule:** `communityApi.ts` is the only file that calls `community-service` URLs. No imports from onboarding or contact pages.

---

## Shared (`shared/auth/`)

```
shared/auth/
├── README.md                     # exists
├── base.py                       # TODO Sprint 1: extract interface
└── cognito.py                    # TODO: JWT validation from platform
```

---

## Files explicitly NOT touched in Sprint 1

```
messaging/          # Sprint 2
cohorts/            # Sprint 3
ai_companion/       # Sprint 5
messaging/consumers.py
```

---

## Module dependency (Sprint 1)

```
api/v1/views/communities.py
  → communities/services/
  → communities/serializers.py
  → infrastructure/feature_flags.py
  → users/middleware.py
  → users/auth/

communities/services/
  → communities/repositories.py
  → analytics/emitter.py
  → users/services/profile_service.py

analytics/emitter.py
  → analytics/storage/ (LocalStorageProvider | S3StorageProvider)
```
