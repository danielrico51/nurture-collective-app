from django.urls import re_path

from messaging.consumers import MessagingConsumer

websocket_urlpatterns = [
    re_path(
        r"^ws/messaging/(?P<channel_id>[0-9a-f-]+)/$",
        MessagingConsumer.as_asgi(),
    ),
]
