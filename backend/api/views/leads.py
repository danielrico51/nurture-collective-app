from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from services.leads.repository import LeadRepository


class LeadDetailView(APIView):
    """GET /api/v1/leads/{lead_id} — latest projected lead state from S3."""

    def get(self, _request: Request, lead_id: str) -> Response:
        repo = LeadRepository()
        lead = repo.get_lead_projection(lead_id)
        if not lead:
            return Response({"error": "Lead not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(lead)
