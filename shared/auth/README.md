# Shared authentication utilities for monorepo services.
#
# TODO Sprint 1: Extract Cognito JWT validation from:
#   - frontend: src/lib/auth/verifyRequest.ts patterns
#   - backend: nurture_platform Cognito settings
#
# Planned modules:
#   shared/auth/cognito.py      — JWT verify + claims parsing
#   shared/auth/permissions.py  — RBAC helpers (parent, provider, admin)
#
# community-service/users/middleware.py will import from here.
