from django.urls import path
from api.views.actions import ExecuteActionView
from api.views.intake import IntakeSubmitView
from api.views.leads import LeadDetailView

urlpatterns = [
    path("actions/execute", ExecuteActionView.as_view(), name="actions-execute"),
    path("intake/submit", IntakeSubmitView.as_view(), name="intake-submit"),
    path("leads/<str:lead_id>", LeadDetailView.as_view(), name="lead-detail"),
]
