import uuid

import django.db.models.deletion
from django.db import migrations, models

from ai_companion.prompts.templates import DAILY_CHECKIN_V1, QA_V1, RECOMMEND_V1


def seed_prompts(apps, schema_editor):
    PromptVersion = apps.get_model("ai_companion", "PromptVersion")
    seeds = [
        ("daily_checkin_v1", 1, DAILY_CHECKIN_V1),
        ("qa_v1", 1, QA_V1),
        ("recommend_v1", 1, RECOMMEND_V1),
    ]
    for slug, version, template in seeds:
        PromptVersion.objects.get_or_create(
            slug=slug,
            version=version,
            defaults={"template": template, "is_active": True},
        )


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PromptVersion",
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
                ("slug", models.CharField(max_length=64)),
                ("version", models.PositiveIntegerField(default=1)),
                ("template", models.TextField()),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "db_table": "ai_companion_promptversion",
            },
        ),
        migrations.CreateModel(
            name="Conversation",
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
                    "conversation_type",
                    models.CharField(
                        choices=[
                            ("checkin", "Daily check-in"),
                            ("qa", "Q&A"),
                            ("recommend", "Resource recommendations"),
                        ],
                        max_length=16,
                    ),
                ),
                ("prompt_slug", models.CharField(max_length=64)),
                ("prompt_version", models.PositiveIntegerField(default=1)),
                (
                    "organization",
                    models.ForeignKey(
                        db_column="organization_id",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="ai_conversations",
                        to="users.organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        db_column="user_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_conversations",
                        to="users.userprofile",
                    ),
                ),
            ],
            options={
                "db_table": "ai_companion_conversation",
            },
        ),
        migrations.CreateModel(
            name="ConversationMessage",
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
                            ("system", "System"),
                            ("user", "User"),
                            ("assistant", "Assistant"),
                        ],
                        max_length=16,
                    ),
                ),
                ("body", models.TextField()),
                (
                    "conversation",
                    models.ForeignKey(
                        db_column="conversation_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="ai_companion.conversation",
                    ),
                ),
            ],
            options={
                "db_table": "ai_companion_message",
            },
        ),
        migrations.AddConstraint(
            model_name="promptversion",
            constraint=models.UniqueConstraint(
                fields=("slug", "version"),
                name="ai_prompt_slug_version_uniq",
            ),
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(
                fields=["user", "conversation_type"],
                name="ai_conv_user_type_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="conversationmessage",
            index=models.Index(
                fields=["conversation", "created_at"],
                name="ai_msg_conv_created_idx",
            ),
        ),
        migrations.RunPython(seed_prompts, migrations.RunPython.noop),
    ]
