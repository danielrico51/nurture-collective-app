from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messaging", "0005_alter_communitypost_body"),
    ]

    operations = [
        migrations.AddField(
            model_name="communitypost",
            name="env_scope",
            field=models.CharField(
                db_index=True,
                default="production",
                help_text="Deployment scope (dev/staging/production) so branch previews do not mix feeds.",
                max_length=32,
            ),
        ),
        migrations.RemoveIndex(
            model_name="communitypost",
            name="post_community_created_idx",
        ),
        migrations.AddIndex(
            model_name="communitypost",
            index=models.Index(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=["community", "env_scope", "-created_at"],
                name="post_comm_env_created_idx",
            ),
        ),
    ]
