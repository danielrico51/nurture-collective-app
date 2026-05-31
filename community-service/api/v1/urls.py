from django.urls import path

from api.v1.views import communities

urlpatterns = [
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
]
