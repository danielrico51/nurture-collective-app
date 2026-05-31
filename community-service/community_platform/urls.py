from django.urls import include, path

from api.health import health_check

urlpatterns = [
    path("health/", health_check),
    path("api/v1/", include("api.v1.urls")),
]
