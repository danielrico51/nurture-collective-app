from django.core.management.base import BaseCommand

from communities.models import Community
from messaging.services.channel_service import ChannelService
from users.models import Organization


class Command(BaseCommand):
    help = "Create default General discussion channels for existing communities."

    def handle(self, *args, **options):
        org = Organization.objects.filter(slug="nurture-collective").first()
        if org is None:
            org = Organization.objects.first()
        if org is None:
            self.stderr.write("No organization found.")
            return

        svc = ChannelService()
        created = 0
        for community in Community.objects.filter(organization=org):
            before = svc.channel_repo.get_default_for_community(community.id)
            svc.create_default_channel_for_community(
                organization_id=org.id,
                community_id=community.id,
            )
            after = svc.channel_repo.get_default_for_community(community.id)
            if before is None and after is not None:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Default channels ready ({created} newly created)."
            )
        )
