import uuid

import factory
from django.utils import timezone

from cohorts.models import Cohort, CohortType
from communities.models import Community, CommunityMembership, CommunityVisibility
from users.models import Organization, PlatformRole, UserProfile


class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization

    name = factory.Sequence(lambda n: f"Organization {n}")
    slug = factory.Sequence(lambda n: f"org-{n}")


class UserProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserProfile

    organization = factory.SubFactory(OrganizationFactory)
    cognito_sub = factory.Sequence(lambda n: f"cognito-sub-{n}")
    platform_role = PlatformRole.PARENT
    display_name = factory.Faker("first_name")


class CommunityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Community

    organization = factory.SubFactory(OrganizationFactory)
    name = factory.Sequence(lambda n: f"Community {n}")
    description = "Test community"
    visibility = CommunityVisibility.PUBLIC
    tags = factory.LazyFunction(list)
    created_by = factory.SubFactory(UserProfileFactory)


class CohortFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cohort

    organization = factory.SubFactory(OrganizationFactory)
    cohort_type = CohortType.PREGNANCY
    name = factory.Sequence(lambda n: f"Cohort {n}")
    description = "Test cohort"
    is_active = True
    metadata = factory.LazyFunction(dict)


class MembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CommunityMembership

    organization = factory.SelfAttribute("community.organization")
    user = factory.SubFactory(UserProfileFactory)
    community = factory.SubFactory(CommunityFactory)
    joined_at = factory.LazyFunction(timezone.now)


def auth_header(user: UserProfile, role: str | None = None) -> dict[str, str]:
    role_value = role or user.platform_role
    return {
        "HTTP_AUTHORIZATION": f"Bearer dev:{role_value}:{user.id}",
    }
