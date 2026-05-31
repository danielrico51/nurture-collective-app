import pytest
from django.apps import apps
from django.core.management import call_command
from django.db import connection


@pytest.mark.django_db
def test_migrations_apply_cleanly():
    call_command("migrate", verbosity=0, interactive=False)
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        tables = {row[0] for row in cursor.fetchall()}
    assert "organizations_organization" in tables
    assert "users_userprofile" in tables
    assert "communities_community" in tables
    assert "communities_membership" in tables


@pytest.mark.django_db
def test_core_models_have_soft_delete_fields():
    for label in (
        "users.Organization",
        "users.UserProfile",
        "communities.Community",
        "communities.CommunityMembership",
    ):
        model = apps.get_model(label)
        field_names = {f.name for f in model._meta.get_fields()}
        assert "created_at" in field_names
        assert "updated_at" in field_names
        assert "deleted_at" in field_names
