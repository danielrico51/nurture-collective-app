from messaging.repositories import ChannelMemberRepository, MessageRepository


def serialize_channel_list_item(channel, user_id) -> dict:
    member_repo = ChannelMemberRepository()
    message_repo = MessageRepository()
    member = member_repo.get(channel.id, user_id)
    last_read = member.last_read_at if member else None
    unread = message_repo.count_unread(channel.id, user_id, last_read)
    last_at = message_repo.get_last_message_at(channel.id)

    return {
        "channel_id": str(channel.id),
        "channel_type": channel.channel_type,
        "community_id": str(channel.community_id) if channel.community_id else None,
        "name": channel.name,
        "unread_count": unread,
        "last_message_at": last_at.isoformat().replace("+00:00", "Z")
        if last_at
        else None,
    }
