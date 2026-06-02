from django.urls import path

from api.v1.views import communities, discussions, messaging, users

urlpatterns = [
    path("users/me/", users.current_user, name="current-user"),
    path(
        "communities/",
        communities.communities_collection,
        name="communities-collection",
    ),
    path("communities/me/", communities.list_my_communities, name="community-me"),
    path(
        "communities/<uuid:community_id>/",
        communities.get_community,
        name="community-detail",
    ),
    path(
        "communities/<uuid:community_id>/join/",
        communities.join_community,
        name="community-join",
    ),
    path(
        "communities/<uuid:community_id>/leave/",
        communities.leave_community,
        name="community-leave",
    ),
    path(
        "communities/<uuid:community_id>/posts/",
        discussions.community_posts,
        name="community-posts",
    ),
    path(
        "communities/<uuid:community_id>/posts/<uuid:post_id>/",
        discussions.community_post_detail,
        name="community-post-detail",
    ),
    path(
        "communities/<uuid:community_id>/posts/<uuid:post_id>/comments/",
        discussions.post_comments,
        name="post-comments",
    ),
    path(
        "communities/<uuid:community_id>/posts/<uuid:post_id>/reactions/",
        discussions.post_reactions,
        name="post-reactions",
    ),
    path("channels/", messaging.channels_collection, name="channels-collection"),
    path(
        "channels/<uuid:channel_id>/messages/",
        messaging.channel_messages,
        name="channel-messages",
    ),
    path(
        "channels/<uuid:channel_id>/read/",
        messaging.channel_mark_read,
        name="channel-read",
    ),
]
