from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("api.urls")),
    path("health/", include("api.health_urls")),
]
