import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

load_dotenv(BASE_DIR / ".env")
# Reuse Cognito pool/client from the Next.js app when not set in community-service/.env
_monorepo_local = REPO_ROOT / ".env.local"
if _monorepo_local.exists():
    load_dotenv(_monorepo_local, override=False)


def _first_env(*keys: str, default: str = "") -> str:
    for key in keys:
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return default

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "channels",
    "users",
    "communities",
    "messaging",
    "cohorts",
    "ai_companion",
    "analytics",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "community_platform.env_scope_middleware.CommunityEnvScopeMiddleware",
    "users.middleware.AuthMiddleware",
]

ROOT_URLCONF = "community_platform.urls"
WSGI_APPLICATION = "community_platform.wsgi.application"
ASGI_APPLICATION = "community_platform.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "community"),
        "USER": os.environ.get("POSTGRES_USER", "community"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "community"),
        "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

_db_url = os.environ.get("DATABASE_URL", "")
if _db_url.startswith(("postgres://", "postgresql://")):
    from urllib.parse import unquote, urlparse

    parsed = urlparse(_db_url)
    if parsed.hostname:
        DATABASES["default"].update(
            {
                "NAME": (parsed.path or "/community").lstrip("/") or "community",
                "USER": unquote(parsed.username or DATABASES["default"]["USER"]),
                "PASSWORD": unquote(parsed.password or DATABASES["default"]["PASSWORD"]),
                "HOST": parsed.hostname,
                "PORT": str(parsed.port or 5432),
            }
        )

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "UNAUTHENTICATED_USER": None,
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# --- Production security hardening (only when DEBUG is off) ---
if not DEBUG:
    if SECRET_KEY == "dev-only-change-me":
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be set to a strong unique value in production."
        )
    if ALLOWED_HOSTS == ["localhost", "127.0.0.1"] or ALLOWED_HOSTS == ["*"]:
        raise RuntimeError(
            "DJANGO_ALLOWED_HOSTS must list your production hostname(s)."
        )

    # Behind an HTTPS load balancer (ALB/CloudFront) terminating TLS.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = (
        os.environ.get("SECURE_SSL_REDIRECT", "true").lower() == "true"
    )
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://redis:6379/0")],
        },
    },
}

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
NURTURE_EVENTS_BUCKET = os.environ.get("NURTURE_EVENTS_BUCKET", "")
EVENTS_USE_LOCAL = os.environ.get("EVENTS_USE_LOCAL", "true").lower() == "true"

COGNITO_REGION = os.environ.get("COGNITO_REGION", AWS_REGION)
COGNITO_USER_POOL_ID = _first_env("COGNITO_USER_POOL_ID", "NEXT_PUBLIC_USER_POOL_ID")
COGNITO_USER_POOL_CLIENT_ID = _first_env(
    "COGNITO_USER_POOL_CLIENT_ID", "NEXT_PUBLIC_USER_POOL_CLIENT_ID"
)
COGNITO_ADMIN_GROUP = _first_env("COGNITO_ADMIN_GROUP", "MANAGEMENT_COGNITO_GROUP", default="admin")
COGNITO_PROVIDER_GROUP = os.environ.get("COGNITO_PROVIDER_GROUP", "provider")
JWT_DEV_BYPASS = os.environ.get("JWT_DEV_BYPASS", "false").lower() == "true"

# Post feed isolation when dev/staging Amplify branches share one community-service.
COMMUNITY_ENV_SCOPE = _first_env("COMMUNITY_ENV_SCOPE", default="production")

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/1")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
