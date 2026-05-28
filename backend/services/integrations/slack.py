"""Slack notifications for intake & conversion process flow."""

from django.conf import settings
import httpx


def _post_webhook(webhook_url: str, text: str) -> bool:
    response = httpx.post(webhook_url, json={"text": text}, timeout=10.0)
    response.raise_for_status()
    return True


def _post_bot_message(channel: str, text: str) -> bool:
    response = httpx.post(
        "https://slack.com/api/chat.postMessage",
        headers={
            "Authorization": f"Bearer {settings.SLACK_BOT_TOKEN}",
            "Content-Type": "application/json; charset=utf-8",
        },
        json={"channel": channel, "text": text, "unfurl_links": False},
        timeout=10.0,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("ok"):
        raise RuntimeError(data.get("error", "chat.postMessage failed"))
    return True


def notify_channel(channel: str, text: str) -> bool:
    """Post to a channel name (bot token) or webhook URL if channel starts with http."""
    if channel.startswith("http"):
        return _post_webhook(channel, text)

    token = settings.SLACK_BOT_TOKEN
    if not token:
        print(f"[slack stub] {channel}: {text}")
        return False

    return _post_bot_message(channel, text)
