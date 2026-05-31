from django.db import models

from users.models import Organization, UserProfile
from users.models_base import TimestampedSoftDeleteModel


class CommunityVisibility(models.TextChoices):
    PUBLIC = "public", "Public"
    PRIVATE = "private", "Private"
    INVITE_ONLY = "invite_only", "Invite only"


class Community(TimestampedSoftDeleteModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="communities",
        db_column="organization_id",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    visibility = models.CharField(
        max_length=16,
        choices=CommunityVisibility.choices,
        default=CommunityVisibility.PUBLIC,
    )
    tags = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_communities",
        db_column="created_by_id",
    )

    class Meta:
        db_table = "communities_community"
        indexes = [
            models.Index(fields=["organization"], name="community_org_idx"),
            models.Index(
                fields=["organization", "visibility"],
                name="community_org_visibility_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(
                fields=["organization", "-created_at"],
                name="community_active_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(fields=["created_by"], name="community_created_by_idx"),
        ]

    def __str__(self) -> str:
        return self.name


class CommunityRole(models.TextChoices):
    MEMBER = "member", "Member"
    MODERATOR = "moderator", "Moderator"
    OWNER = "owner", "Owner"


class CommunityMembership(TimestampedSoftDeleteModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="memberships",
        db_column="organization_id",
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="community_memberships",
        db_column="user_id",
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name="memberships",
        db_column="community_id",
    )
    role = models.CharField(
        max_length=16,
        choices=CommunityRole.choices,
        default=CommunityRole.MEMBER,
    )
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "communities_membership"
        indexes = [
            models.Index(fields=["organization"], name="membership_org_idx"),
            models.Index(
                fields=["community", "-joined_at"],
                name="mbr_cmty_active_idx",
                condition=models.Q(left_at__isnull=True, deleted_at__isnull=True),
            ),
            models.Index(
                fields=["user", "-joined_at"],
                name="membership_user_active_idx",
                condition=models.Q(left_at__isnull=True, deleted_at__isnull=True),
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "community"],
                condition=models.Q(left_at__isnull=True, deleted_at__isnull=True),
                name="mbr_user_cmty_active_uniq",
            ),
        ]

    @property
    def is_active(self) -> bool:
        return self.left_at is None and self.deleted_at is None

    def __str__(self) -> str:
        return f"{self.user_id} in {self.community_id}"
