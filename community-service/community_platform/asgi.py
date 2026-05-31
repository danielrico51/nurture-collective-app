import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "community_platform.settings")

django_asgi_app = get_asgi_application()

# WebSocket routing added in Sprint 2 (messaging/routing.py)
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter([]),
    }
)
