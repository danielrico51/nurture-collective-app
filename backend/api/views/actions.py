from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from services.actions.executor import ActionExecutionError, execute_action
from services.schemas.actions import ActionExecuteRequest


class ExecuteActionView(APIView):
    """POST /api/v1/actions/execute — orchestrates lead/client workflows."""

    def post(self, request: Request) -> Response:
        try:
            payload = ActionExecuteRequest.model_validate(request.data)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        actor = request.headers.get("X-Actor-Id", "system")

        try:
            result = execute_action(
                entity_type=payload.entity_type,
                entity_id=payload.entity_id,
                action=payload.action,
                params=payload.params,
                actor=actor,
            )
            return Response(result, status=status.HTTP_200_OK)
        except ActionExecutionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
