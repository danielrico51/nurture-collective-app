from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self) -> None:
        from users.middleware import validate_dev_bypass_settings

        validate_dev_bypass_settings()
