import pytest

from communities.repositories import CommunityRepository, MembershipRepository
from tests.factories import CommunityFactory, MembershipFactory, UserProfileFactory


@pytest.mark.django_db
def test_community_repository_get_by_id_scoped_to_org(organization):
    other_org = CommunityFactory().organization
    community = CommunityFactory(organization=organization)
    repo = CommunityRepository()

    assert repo.get_by_id(community.id, organization_id=organization.id) is not None
    assert repo.get_by_id(community.id, organization_id=other_org.id) is None


@pytest.mark.django_db
def test_community_repository_annotates_member_count(organization):
    community = CommunityFactory(organization=organization)
    user = UserProfileFactory(organization=organization)
    MembershipFactory(community=community, user=user, organization=organization)

    repo = CommunityRepository()
    qs = repo.annotate_member_count(repo.list_for_organization(organization.id))
    annotated = qs.get(id=community.id)
    assert annotated.member_count == 1


@pytest.mark.django_db
def test_membership_repository_get_active(organization):
    membership = MembershipFactory(organization=organization)
    repo = MembershipRepository()

    active = repo.get_active(membership.user_id, membership.community_id)
    assert active is not None
    assert active.id == membership.id


@pytest.mark.django_db
def test_membership_repository_list_active_for_user(organization):
    user = UserProfileFactory(organization=organization)
    MembershipFactory(user=user, organization=organization)
    MembershipFactory(user=user, organization=organization)

    repo = MembershipRepository()
    assert repo.list_active_for_user(user.id).count() == 2
