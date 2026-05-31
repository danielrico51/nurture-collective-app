import json
from datetime import datetime
from pathlib import Path

from django.conf import settings

from analytics.events import CommunityEvent
from analytics.s3_paths import event_s3_key


class LocalStorageProvider:
    def __init__(self, root: Path | None = None):
        self.root = root or Path(settings.BASE_DIR) / ".data" / "events"

    def write(self, event: CommunityEvent) -> str:
        dt = datetime.fromisoformat(event.occurred_at.replace("Z", "+00:00"))
        relative = event_s3_key(event.domain, event.event_type, event.event_id, dt)
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "domain": event.domain,
            "organization_id": event.organization_id,
            "user_id": event.user_id,
            "occurred_at": event.occurred_at,
            "properties": event.properties,
            "schema_version": event.schema_version,
        }
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return str(path)
