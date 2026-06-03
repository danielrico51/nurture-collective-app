from django.core.management.base import BaseCommand
from django.db import transaction

from messaging.models import CommunityPost, Message, PostComment, PostReaction


class Command(BaseCommand):
    help = (
        "Hard-delete all community feed data (posts, comments, reactions) and "
        "channel chat messages. Keeps communities, memberships, channels, and users."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print counts only; do not delete.",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt (required for non-interactive runs).",
        )

    def handle(self, *args, **options):
        counts = {
            "post_reactions": PostReaction.objects.count(),
            "post_comments": PostComment.all_objects.count(),
            "community_posts": CommunityPost.all_objects.count(),
            "channel_messages": Message.all_objects.count(),
        }

        self.stdout.write("Records to remove:")
        for label, n in counts.items():
            self.stdout.write(f"  {label}: {n}")

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        if not options["yes"]:
            self.stdout.write(
                self.style.WARNING(
                    "This permanently deletes feed and chat message history. "
                    "Communities and memberships are kept."
                )
            )
            confirm = input("Type 'purge' to continue: ").strip()
            if confirm != "purge":
                self.stdout.write("Aborted.")
                return

        with transaction.atomic():
            deleted_reactions, _ = PostReaction.objects.all().delete()
            # all_objects bypasses soft-delete manager → hard DELETE
            deleted_comments, _ = PostComment.all_objects.all().delete()
            deleted_posts, _ = CommunityPost.all_objects.all().delete()
            deleted_messages, _ = Message.all_objects.all().delete()

        self.stdout.write(
            self.style.SUCCESS(
                "Purged: "
                f"{deleted_reactions} reactions, "
                f"{deleted_comments} comments, "
                f"{deleted_posts} posts, "
                f"{deleted_messages} channel messages."
            )
        )
