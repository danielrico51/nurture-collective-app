import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Community",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "visibility",
                    models.CharField(
                        choices=[
                            ("public", "Public"),
                            ("private", "Private"),
                            ("invite_only", "Invite only"),
                        ],
                        default="public",
                        max_length=16,
                    ),
                ),
                ("tags", models.JSONField(blank=True, default=list)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        db_column="created_by_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_communities",
                        to="users.userprofile",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        db_column="organization_id",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="communities",
                        to="users.organization",
                    ),
                ),
            ],
            options={"db_table": "communities_community"},
        ),
        migrations.CreateModel(
            name="CommunityMembership",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("member", "Member"),
                            ("moderator", "Moderator"),
                            ("owner", "Owner"),
                        ],
                        default="member",
                        max_length=16,
                    ),
                ),
                ("joined_at", models.DateTimeField()),
                ("left_at", models.DateTimeField(blank=True, null=True)),
                (
                    "community",
                    models.ForeignKey(
                        db_column="community_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="memberships",
                        to="communities.community",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        db_column="organization_id",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="memberships",
                        to="users.organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        db_column="user_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="community_memberships",
                        to="users.userprofile",
                    ),
                ),
            ],
            options={"db_table": "communities_membership"},
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(fields=["organization"], name="community_org_idx"),
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=["organization", "visibility"],
                name="community_org_visibility_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=["organization", "-created_at"],
                name="community_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(fields=["created_by"], name="community_created_by_idx"),
        ),
        migrations.AddIndex(
            model_name="communitymembership",
            index=models.Index(fields=["organization"], name="membership_org_idx"),
        ),
        migrations.AddIndex(
            model_name="communitymembership",
            index=models.Index(
                condition=models.Q(
                    ("deleted_at__isnull", True), ("left_at__isnull", True)
                ),
                fields=["community", "-joined_at"],
                name="mbr_cmty_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="communitymembership",
            index=models.Index(
                condition=models.Q(
                    ("deleted_at__isnull", True), ("left_at__isnull", True)
                ),
                fields=["user", "-joined_at"],
                name="membership_user_active_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="communitymembership",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("deleted_at__isnull", True), ("left_at__isnull", True)
                ),
                fields=("user", "community"),
                name="mbr_user_cmty_active_uniq",
            ),
        ),
    ]
