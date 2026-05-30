from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from services.intake_service import (
    IntakePipelineError,
    IntakeValidationError,
    RateLimitError,
    intake_health,
    submit_intake,
)


class IntakeSubmitView(APIView):
    """POST /api/v1/intake/submit — website intake pipeline."""

    def post(self, request: Request) -> Response:
        client_key = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        if not client_key:
            client_key = request.META.get("REMOTE_ADDR", "anonymous")

        try:
            result = submit_intake(request.data, client_key=client_key)
            return Response(result.model_dump(), status=status.HTTP_200_OK)
        except RateLimitError as exc:
            return Response(
                {"success": False, "error": str(exc), "code": "rate_limited"},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except IntakeValidationError as exc:
            return Response(
                {"success": False, "error": str(exc), "code": "validation_error"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntakePipelineError as exc:
            return Response(
                {"success": False, "error": str(exc), "code": "pipeline_error"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return Response(
                {"success": False, "error": str(exc), "code": "internal_error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IntakeHealthView(APIView):
    """GET /health/intake — intake pipeline health."""

    def get(self, _request: Request) -> Response:
        return Response(intake_health(), status=status.HTTP_200_OK)
