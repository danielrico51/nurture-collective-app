import pytest
from django.core.management import call_command

from communities.models import Community, CommunityMembership
from users.models import Organization, UserProfile


@pytest.mark.django_db
def test_seed_communities_demo_is_idempotent(organization):
    call_command("seed_communities_demo")
    first_count = Community.objects.count()
    call_command("seed_communities_demo")
    assert Community.objects.count() == first_count


@pytest.mark.django_db
def test_seed_communities_demo_creates_public_groups(organization):
    call_command("seed_communities_demo")
    assert Community.objects.filter(visibility="public").count() >= 5
    assert Community.objects.filter(name="Postpartum Support Circle").exists()


@pytest.mark.django_db
def test_seed_with_users_and_join_demo(organization):
    call_command("seed_communities_demo", with_users=True, join_demo=True)
    assert UserProfile.objects.filter(cognito_sub__startswith="seed-demo-").count() == 3
    assert CommunityMembership.objects.filter(left_at__isnull=True).count() >= 2
