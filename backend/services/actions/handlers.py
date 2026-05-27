from typing import Any
from uuid import uuid4

from services.actions.registry import ActionExecutionError, register_action
from services.events.emitter import emit_event
from services.leads.repository import LeadRepository
from services.schemas.event import EventActor
from services.schemas.lead import LeadProfile
from services.s3.writer import append_client_artifact, append_lead_artifact


@register_action("qualify")
def qualify_lead(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("qualify applies to leads only")
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.status = "intake_completed"
    key = repo.save_lead_profile(lead)
    event = emit_event("lead.qualified", "lead", entity_id, {"status": lead.status}, actor)
    return {"lead": lead.model_dump(), "artifact_key": key, "event_id": event.event_id}


@register_action("assign_coordinator")
def assign_coordinator(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("assign_coordinator applies to leads only")
    coordinator_id = params.get("coordinator_id", "")
    if not coordinator_id:
        raise ActionExecutionError("coordinator_id is required")

    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.coordinator_id = coordinator_id
    key = repo.save_lead_profile(lead)
    note_key = append_lead_artifact(
        entity_id,
        "coordinator_notes",
        "note.json",
        {"type": "assignment", "coordinator_id": coordinator_id, "actor": actor.model_dump()},
    )
    event = emit_event(
        "lead.coordinator_assigned",
        "lead",
        entity_id,
        {"coordinator_id": coordinator_id},
        actor,
    )
    return {
        "lead": lead.model_dump(),
        "artifact_key": key,
        "note_key": note_key,
        "event_id": event.event_id,
    }


@register_action("record_consult_booking")
def record_consult_booking(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("record_consult_booking applies to leads only")

    scheduling_key = append_lead_artifact(
        entity_id, "scheduling", "consult.json", params
    )
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.status = "consult_scheduled"
    profile_key = repo.save_lead_profile(lead)
    event = emit_event("consult.booked", "lead", entity_id, params, actor)

    # Async AI prep brief (Celery)
    from services.ai.tasks import generate_coordinator_brief

    generate_coordinator_brief.delay(entity_id)

    return {
        "scheduling_key": scheduling_key,
        "profile_key": profile_key,
        "event_id": event.event_id,
    }


@register_action("record_call_log")
def record_call_log(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("record_call_log applies to leads only")

    log_key = append_lead_artifact(
        entity_id, "coordinator_notes", "call_log.json", params
    )
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.status = "consult_completed"
    profile_key = repo.save_lead_profile(lead)
    event = emit_event("consult.completed", "lead", entity_id, params, actor)
    return {"call_log_key": log_key, "profile_key": profile_key, "event_id": event.event_id}


@register_action("generate_proposal")
def generate_proposal(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("generate_proposal applies to leads only")

    from services.ai.tasks import generate_proposal_draft

    task = generate_proposal_draft.delay(entity_id, params)
    event = emit_event("proposal.generation_requested", "lead", entity_id, params, actor)
    return {"task_id": task.id, "event_id": event.event_id}


@register_action("mark_stale")
def mark_stale(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("mark_stale applies to leads only")
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.status = "stale"
    key = repo.save_lead_profile(lead)
    event = emit_event("lead.stale", "lead", entity_id, params, actor)
    return {"lead": lead.model_dump(), "artifact_key": key, "event_id": event.event_id}


@register_action("mark_lost")
def mark_lost(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("mark_lost applies to leads only")
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id) or LeadProfile(lead_id=entity_id)
    lead.status = "lost"
    key = repo.save_lead_profile(lead)
    event = emit_event("lead.lost", "lead", entity_id, params, actor)
    return {"lead": lead.model_dump(), "artifact_key": key, "event_id": event.event_id}


@register_action("create_contract_draft")
def create_contract_draft(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("create_contract_draft applies to leads only")

    from services.ai.tasks import generate_contract_draft

    task = generate_contract_draft.delay(entity_id, params)
    event = emit_event("contract.draft.requested", "lead", entity_id, params, actor)
    return {"task_id": task.id, "event_id": event.event_id}


@register_action("convert_to_client")
def convert_to_client(
    entity_type: str,
    entity_id: str,
    params: dict[str, Any],
    actor: EventActor,
) -> dict[str, Any]:
    if entity_type != "lead":
        raise ActionExecutionError("convert_to_client applies to leads only")

    client_id = params.get("client_id") or f"client_{uuid4().hex[:12]}"
    repo = LeadRepository()
    lead = repo.get_lead_projection(entity_id)
    if not lead:
        raise ActionExecutionError("Lead not found")

    lead.status = "converted"
    repo.save_lead_profile(lead)

    ref_key = append_client_artifact(
        client_id,
        "references",
        "lead_reference.json",
        {"lead_id": entity_id, "converted_at": lead.model_dump().get("written_at")},
    )
    profile_key = append_client_artifact(
        client_id,
        "profile",
        "profile.json",
        {
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "converted_from_lead": entity_id,
        },
    )

    event = emit_event(
        "client.created",
        "client",
        client_id,
        {"lead_id": entity_id},
        actor,
    )
    emit_event("lead.converted", "lead", entity_id, {"client_id": client_id}, actor)

    return {
        "client_id": client_id,
        "reference_key": ref_key,
        "profile_key": profile_key,
        "event_id": event.event_id,
    }
