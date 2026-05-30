from django.http import JsonResponse
from django.urls import path

from services.intake_service import intake_health


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "nurture-platform-api"})


def intake_health_check(_request):
    return JsonResponse(intake_health())


urlpatterns = [
    path("", health_check),
    path("intake/", intake_health_check),
]
