import json
from uuid import UUID

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from infrastructure.feature_flags import is_enabled
from messaging.services.message_service import MessageService


class MessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not is_enabled("ENABLE_GROUP_CHAT"):
            await self.close()
            return

        self.channel_id = UUID(self.scope["url_route"]["kwargs"]["channel_id"])
        self.auth = self.scope.get("auth_context")
        if self.auth is None:
            await self.close()
            return

        allowed = await database_sync_to_async(self._can_join_channel)()
        if not allowed:
            await self.close()
            return

        self.room_group_name = f"channel_{self.channel_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    def _can_join_channel(self) -> bool:
        try:
            MessageService().channel_service._require_channel_member(
                self.auth, self.channel_id
            )
            return True
        except Exception:
            return False

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            content = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_json(
                {
                    "type": "error",
                    "payload": {"code": "INVALID_JSON", "message": "Invalid JSON"},
                }
            )
            return

        msg_type = content.get("type")
        if msg_type == "message.send":
            payload = await database_sync_to_async(self._send_message)(
                content.get("body", ""),
                content.get("metadata") or {},
            )
            if payload:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "chat.message", "payload": payload},
                )
        elif msg_type == "presence.ping":
            await self.send_json(
                {"type": "presence", "payload": {"user_id": str(self.auth.user_id)}}
            )

    def _send_message(self, body: str, metadata: dict) -> dict | None:
        try:
            message = MessageService().send(
                self.auth,
                self.channel_id,
                body=body,
                metadata=metadata,
            )
            return MessageService().serialize_message(message)
        except Exception as exc:
            return None

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps({"type": "message.new", "payload": event["payload"]})
        )

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))
