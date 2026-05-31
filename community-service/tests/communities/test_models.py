import pytest
from django.utils import timezone

from communities.models import CommunityMembership
from communities.repositories import MembershipRepository
from tests.factories import CommunityFactory, MembershipFactory, UserProfileFactory


@pytest.mark.django_db
def test_soft_delete_excludes_from_default_manager(organization):
    from communities.models import Community

    community = CommunityFactory(organization=organization)
    community.soft_delete()
    assert Community.objects.filter(id=community.id).exists() is False
    assert Community.all_objects.filter(id=community.id).exists() is True


@pytest.mark.django_db
def test_active_membership_unique_constraint(organization):
    user = UserProfileFactory(organization=organization)
    community = CommunityFactory(organization=organization)
    MembershipFactory(user=user, community=community, organization=organization)
    with pytest.raises(Exception):
        MembershipFactory(user=user, community=community, organization=organization)


@pytest.mark.django_db
def test_membership_leave_sets_left_at(organization):
    membership = MembershipFactory(organization=organization)
    membership.left_at = timezone.now()
    MembershipRepository().save(membership)
    membership.refresh_from_db()
    assert membership.left_at is not None
