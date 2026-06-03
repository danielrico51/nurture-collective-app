from django.core.management.base import BaseCommand
from django.utils import timezone

from communities.models import Community, CommunityMembership, CommunityVisibility
from users.models import Organization, PlatformRole, UserProfile


SEED_COMMUNITIES = [
    {
        "name": "Postpartum Support Circle",
        "description": (
            "A welcoming space for new moms navigating the fourth trimester — "
            "sleep, feeding, recovery, and emotional check-ins."
        ),
        "visibility": CommunityVisibility.PUBLIC,
        "tags": ["postpartum", "newborn", "support"],
    },
    {
        "name": "First-Time Moms",
        "description": (
            "Questions, milestones, and encouragement for moms expecting or "
            "welcoming their first baby."
        ),
        "visibility": CommunityVisibility.PUBLIC,
        "tags": ["pregnancy", "first-time", "questions"],
    },
    {
        "name": "Working Moms Network",
        "description": (
            "Balancing career and motherhood — return-to-work, pumping, childcare, "
            "and boundary-setting."
        ),
        "visibility": CommunityVisibility.PUBLIC,
        "tags": ["working", "career", "balance"],
    },
    {
        "name": "NICU & Special Care Parents",
        "description": (
            "Peer support for families with babies in the NICU or with complex "
            "medical needs."
        ),
        "visibility": CommunityVisibility.PUBLIC,
        "tags": ["nicu", "special-care", "support"],
    },
    {
        "name": "Northern NJ Local Moms",
        "description": (
            "Connect with moms in Bergen, Essex, Hudson, and nearby counties — "
            "meetups, referrals, and local resources."
        ),
        "visibility": CommunityVisibility.PUBLIC,
        "tags": ["local", "new-jersey", "meetups"],
    },
    {
        "name": "Coordinator Circle",
        "description": "Private space for Nurture Collective coordinators and admins.",
        "visibility": CommunityVisibility.PRIVATE,
        "tags": ["internal", "staff"],
    },
]

SEED_USERS = [
    {
        "cognito_sub": "seed-demo-parent-1",
        "platform_role": PlatformRole.PARENT,
        "display_name": "Demo Parent One",
    },
    {
        "cognito_sub": "seed-demo-parent-2",
        "platform_role": PlatformRole.PARENT,
        "display_name": "Demo Parent Two",
    },
    {
        "cognito_sub": "seed-demo-admin",
        "platform_role": PlatformRole.ADMIN,
        "display_name": "Demo Admin",
    },
]


class Command(BaseCommand):
    help = "Seed demo organizations, communities, and optional dev users for local QA."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-users",
            action="store_true",
            help="Create demo UserProfile rows for manual API testing.",
        )
        parser.add_argument(
            "--join-demo",
            action="store_true",
            help="Join demo parent users to the first two public communities.",
        )

    def handle(self, *args, **options):
        org, _ = Organization.objects.get_or_create(
            slug="nurture-collective",
            defaults={"name": "Nurture Collective LLC"},
        )
        self.stdout.write(f"Organization: {org.name} ({org.id})")

        created_count = 0
        communities: list[Community] = []

        for item in SEED_COMMUNITIES:
            community, created = Community.objects.get_or_create(
                organization=org,
                name=item["name"],
                defaults={
                    "description": item["description"],
                    "visibility": item["visibility"],
                    "tags": item["tags"],
                },
            )
            communities.append(community)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + {community.name}"))
            else:
                self.stdout.write(f"  = {community.name} (exists)")

        self.stdout.write(
            self.style.SUCCESS(
                f"Communities ready: {len(communities)} total, {created_count} newly created."
            )
        )

        if options["with_users"]:
            for user_spec in SEED_USERS:
                profile, created = UserProfile.objects.get_or_create(
                    cognito_sub=user_spec["cognito_sub"],
                    defaults={
                        "organization": org,
                        "platform_role": user_spec["platform_role"],
                        "display_name": user_spec["display_name"],
                    },
                )
                label = "created" if created else "exists"
                self.stdout.write(f"  User {profile.display_name}: {label} ({profile.id})")

        if options["join_demo"]:
            parents = UserProfile.objects.filter(
                organization=org,
                platform_role=PlatformRole.PARENT,
                cognito_sub__startswith="seed-demo-parent",
            )
            public = [c for c in communities if c.visibility == CommunityVisibility.PUBLIC][:2]
            joined = 0
            for parent in parents:
                for community in public:
                    _, created = CommunityMembership.objects.get_or_create(
                        organization=org,
                        user=parent,
                        community=community,
                        left_at=None,
                        defaults={"joined_at": timezone.now(), "role": "member"},
                    )
                    if created:
                        joined += 1
            self.stdout.write(self.style.SUCCESS(f"Demo memberships created: {joined}"))

        from django.core.management import call_command

        call_command("seed_community_channels")
        call_command("seed_cohorts_demo")

        self.stdout.write("")
        self.stdout.write("Next steps:")
        self.stdout.write("  1. Set COMMUNITY_API_URL=http://localhost:8001 in Next.js .env.local")
        self.stdout.write(
            "  2. Start API with: daphne -b 0.0.0.0 -p 8001 community_platform.asgi:application"
        )
        self.stdout.write("  3. Sign in, join a community, open it, and use General discussion")
        self.stdout.write(
            "  3. Optional dev token: Bearer dev:parent:seed-demo-parent-1 "
            "(only when JWT_DEV_BYPASS=true)"
        )
