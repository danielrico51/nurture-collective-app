from rest_framework import serializers

from communities.models import CommunityVisibility


class CommunityCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    visibility = serializers.ChoiceField(
        choices=CommunityVisibility.values,
        default=CommunityVisibility.PUBLIC,
    )
    tags = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        default=list,
    )


class MembershipSerializer(serializers.Serializer):
    membership_id = serializers.UUIDField(source="id")
    community_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    role = serializers.CharField()
    joined_at = serializers.DateTimeField()


class CommunityListSerializer(serializers.Serializer):
    community_id = serializers.UUIDField(source="id")
    organization_id = serializers.UUIDField()
    name = serializers.CharField()
    description = serializers.CharField()
    visibility = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    member_count = serializers.IntegerField(required=False, default=0)


class CommunityDetailSerializer(CommunityListSerializer):
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    my_membership = MembershipSerializer(required=False, allow_null=True)


class MyCommunitySerializer(serializers.Serializer):
    membership_id = serializers.UUIDField(source="id")
    community_id = serializers.UUIDField(source="community.id")
    organization_id = serializers.UUIDField()
    name = serializers.CharField(source="community.name")
    description = serializers.CharField(source="community.description")
    visibility = serializers.CharField(source="community.visibility")
    tags = serializers.ListField(source="community.tags", child=serializers.CharField())
    role = serializers.CharField()
    joined_at = serializers.DateTimeField()
