import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-in-production")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "nurture_platform.urls"
WSGI_APPLICATION = "nurture_platform.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# SQLite is bootstrap-only (sessions/admin). Canonical data is S3.
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "UNAUTHENTICATED_USER": None,
}

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

# --- AWS S3 platform buckets ---
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKETS = {
    "leads": os.environ.get("NURTURE_LEADS_BUCKET", ""),
    "clients": os.environ.get("NURTURE_CLIENTS_BUCKET", ""),
    "events": os.environ.get("NURTURE_EVENTS_BUCKET", ""),
    "contracts": os.environ.get("NURTURE_CONTRACTS_BUCKET", ""),
    "proposals": os.environ.get("NURTURE_PROPOSALS_BUCKET", ""),
    "notifications": os.environ.get("NURTURE_NOTIFICATIONS_BUCKET", ""),
    "analytics": os.environ.get("NURTURE_ANALYTICS_BUCKET", ""),
}

# --- Cognito JWT (validate in middleware — Sprint 2) ---
COGNITO_REGION = os.environ.get("NEXT_PUBLIC_AWS_REGION", AWS_REGION)
COGNITO_USER_POOL_ID = os.environ.get("NEXT_PUBLIC_USER_POOL_ID", "")

# --- Celery ---
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "false").lower() == "true"

# --- Integrations ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
SLACK_CHANNEL_NEW_LEADS = os.environ.get("SLACK_CHANNEL_NEW_LEADS", "#new-leads")
SLACK_CHANNEL_SCHEDULED_CALLS = os.environ.get("SLACK_CHANNEL_SCHEDULED_CALLS", "#scheduled-calls")
