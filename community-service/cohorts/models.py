import uuid

from django.db import models

from communities.models import Community
from users.models import Organization, UserProfile


class CohortType(models.TextChoices):
    PREGNANCY = "pregnancy", "Pregnancy"
    NEWBORN = "newborn", "Newborn"
    POSTPARTUM = "postpartum", "Postpartum"


class CohortMembershipSource(models.TextChoices):
    AUTO = "auto", "Auto"
    MANUAL = "manual", "Manual"
    RECOMMENDED = "recommended", "Recommended"


class Cohort(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="cohorts",
        db_column="organization_id",
    )
    cohort_type = models.CharField(max_length=16, choices=CohortType.choices)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    linked_community = models.ForeignKey(
        Community,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_cohorts",
        db_column="linked_community_id",
    )
    window_start = models.DateField(null=True, blank=True)
    window_end = models.DateField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cohorts_cohort"
        indexes = [
            models.Index(
                fields=["organization", "cohort_type", "is_active"],
                name="cohort_org_type_active_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class CohortMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="cohort_memberships",
        db_column="organization_id",
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="cohort_memberships",
        db_column="user_id",
    )
    cohort = models.ForeignKey(
        Cohort,
        on_delete=models.CASCADE,
        related_name="memberships",
        db_column="cohort_id",
    )
    source = models.CharField(
        max_length=16,
        choices=CohortMembershipSource.choices,
        default=CohortMembershipSource.AUTO,
    )
    assigned_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cohorts_membership"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "cohort"],
                name="cohort_mbr_user_cohort_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} in {self.cohort_id}"
