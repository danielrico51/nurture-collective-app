# Shared authentication utilities for monorepo services.
#
# Cognito JWT validation for community-service lives in:
#   community-service/users/auth/cognito_provider.py
#
# Next.js verifies tokens in src/lib/auth/verifyRequest.ts and forwards the
# same ID token via src/lib/community/proxy.ts.
#
# Planned extraction:
#   shared/auth/cognito.py      — JWT verify + claims parsing (Python)
#   shared/auth/permissions.py  — RBAC helpers (parent, provider, admin)
