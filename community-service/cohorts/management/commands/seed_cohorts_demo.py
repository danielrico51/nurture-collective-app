from datetime import date

from django.core.management.base import BaseCommand

from cohorts.models import Cohort, CohortType
from communities.models import Community
from users.models import Organization


def _community_by_name(org, name: str) -> Community | None:
    return Community.objects.filter(organization=org, name=name).first()


class Command(BaseCommand):
    help = "Seed demo cohorts linked to existing communities (run after seed_communities_demo)."

    def handle(self, *args, **options):
        org = Organization.objects.filter(slug="nurture-collective").first()
        if org is None:
            self.stderr.write("Run seed_communities_demo first (no organization).")
            return

        first_time = _community_by_name(org, "First-Time Moms")
        postpartum = _community_by_name(org, "Postpartum Support Circle")

        specs = [
            {
                "cohort_type": CohortType.PREGNANCY,
                "name": "Due June 2026",
                "description": "Moms with due dates in June 2026",
                "window_start": date(2026, 6, 1),
                "window_end": date(2026, 6, 30),
                "linked_community": first_time,
                "metadata": {},
            },
            {
                "cohort_type": CohortType.PREGNANCY,
                "name": "Due July 2026",
                "description": "Moms with due dates in July 2026",
                "window_start": date(2026, 7, 1),
                "window_end": date(2026, 7, 31),
                "linked_community": first_time,
                "metadata": {},
            },
            {
                "cohort_type": CohortType.POSTPARTUM,
                "name": "First 12 Weeks Postpartum",
                "description": "Early postpartum support (weeks 0–12)",
                "window_start": None,
                "window_end": None,
                "linked_community": postpartum,
                "metadata": {"week_min": 0, "week_max": 12},
            },
            {
                "cohort_type": CohortType.POSTPARTUM,
                "name": "Weeks 13–26 Postpartum",
                "description": "Mid postpartum (weeks 13–26)",
                "window_start": None,
                "window_end": None,
                "linked_community": postpartum,
                "metadata": {"week_min": 13, "week_max": 26},
            },
            {
                "cohort_type": CohortType.NEWBORN,
                "name": "Newborn 0–30 Days",
                "description": "Brand-new babies, first month",
                "window_start": None,
                "window_end": None,
                "linked_community": postpartum,
                "metadata": {"day_min": 0, "day_max": 30},
            },
            {
                "cohort_type": CohortType.NEWBORN,
                "name": "Newborn 31–90 Days",
                "description": "Babies one to three months old",
                "window_start": None,
                "window_end": None,
                "linked_community": postpartum,
                "metadata": {"day_min": 31, "day_max": 90},
            },
        ]

        created = 0
        for spec in specs:
            cohort, was_created = Cohort.objects.get_or_create(
                organization=org,
                name=spec["name"],
                defaults={
                    "cohort_type": spec["cohort_type"],
                    "description": spec["description"],
                    "window_start": spec["window_start"],
                    "window_end": spec["window_end"],
                    "linked_community": spec["linked_community"],
                    "metadata": spec["metadata"],
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  + {cohort.name}"))
            else:
                self.stdout.write(f"  = {cohort.name} (exists)")

        self.stdout.write(
            self.style.SUCCESS(f"Cohorts ready: {len(specs)} total, {created} newly created.")
        )
