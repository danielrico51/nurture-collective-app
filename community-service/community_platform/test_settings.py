import os

os.environ.setdefault("ENABLE_COMMUNITIES", "true")
os.environ.setdefault("ENABLE_GROUP_CHAT", "true")
os.environ.setdefault("JWT_DEV_BYPASS", "true")
os.environ.setdefault("EVENTS_USE_LOCAL", "true")

from community_platform.settings import *  # noqa: E402,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
