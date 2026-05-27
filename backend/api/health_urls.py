from django.http import JsonResponse
from django.urls import path


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "nurture-platform-api"})


urlpatterns = [
    path("", health_check),
]
