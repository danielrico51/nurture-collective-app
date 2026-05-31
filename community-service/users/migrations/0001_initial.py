# Generated manually for Sprint 1

import uuid

import django.db.models.deletion
from django.db import migrations, models


def seed_default_organization(apps, schema_editor):
    Organization = apps.get_model("users", "Organization")
    Organization.objects.get_or_create(
        slug="nurture-collective",
        defaults={"name": "Nurture Collective LLC"},
    )


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Organization",
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
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=64, unique=True)),
            ],
            options={"db_table": "organizations_organization"},
        ),
        migrations.CreateModel(
            name="UserProfile",
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
                ("cognito_sub", models.CharField(max_length=128, unique=True)),
                (
                    "platform_role",
                    models.CharField(
                        choices=[
                            ("parent", "Parent"),
                            ("provider", "Provider"),
                            ("admin", "Admin"),
                        ],
                        default="parent",
                        max_length=16,
                    ),
                ),
                ("display_name", models.CharField(blank=True, default="", max_length=255)),
                ("profile_metadata", models.JSONField(blank=True, default=dict)),
                (
                    "organization",
                    models.ForeignKey(
                        db_column="organization_id",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="users",
                        to="users.organization",
                    ),
                ),
            ],
            options={"db_table": "users_userprofile"},
        ),
        migrations.AddIndex(
            model_name="organization",
            index=models.Index(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=["id"],
                name="org_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="userprofile",
            index=models.Index(fields=["organization"], name="user_org_idx"),
        ),
        migrations.AddIndex(
            model_name="userprofile",
            index=models.Index(
                fields=["organization", "platform_role"], name="user_org_role_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="userprofile",
            index=models.Index(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=["organization", "id"],
                name="user_active_idx",
            ),
        ),
        migrations.RunPython(seed_default_organization, migrations.RunPython.noop),
    ]
