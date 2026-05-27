import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nurture_platform.settings")

app = Celery("nurture_platform")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
