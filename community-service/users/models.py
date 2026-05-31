from django.db import models

from users.models_base import TimestampedSoftDeleteModel


class Organization(TimestampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, unique=True)

    class Meta:
        db_table = "organizations_organization"
        indexes = [
            models.Index(
                fields=["id"],
                name="org_active_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.name


class PlatformRole(models.TextChoices):
    PARENT = "parent", "Parent"
    PROVIDER = "provider", "Provider"
    ADMIN = "admin", "Admin"


class UserProfile(TimestampedSoftDeleteModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="users",
        db_column="organization_id",
    )
    cognito_sub = models.CharField(max_length=128, unique=True)
    platform_role = models.CharField(
        max_length=16,
        choices=PlatformRole.choices,
        default=PlatformRole.PARENT,
    )
    display_name = models.CharField(max_length=255, blank=True, default="")
    profile_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "users_userprofile"
        indexes = [
            models.Index(fields=["organization"], name="user_org_idx"),
            models.Index(
                fields=["organization", "platform_role"],
                name="user_org_role_idx",
            ),
            models.Index(
                fields=["organization", "id"],
                name="user_active_idx",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.display_name or self.cognito_sub
