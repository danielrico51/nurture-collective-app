"""Slack notifications — Sprint 2: wire slack_sdk."""

from django.conf import settings


def notify_channel(channel: str, text: str) -> bool:
    token = settings.SLACK_BOT_TOKEN
    if not token:
        print(f"[slack stub] {channel}: {text}")
        return False
    # TODO: slack_sdk WebClient().chat_postMessage(channel=channel, text=text)
    print(f"[slack] {channel}: {text}")
    return True
