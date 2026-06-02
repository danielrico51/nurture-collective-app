from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messaging", "0003_post_reactions"),
    ]

    operations = [
        migrations.AddField(
            model_name="communitypost",
            name="image_urls",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
