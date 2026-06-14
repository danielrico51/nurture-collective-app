import { NextRequest, NextResponse } from "next/server";
import {
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  createManualLead,
  listCrmLeads,
} from "@/lib/leads/storage";
import { ManualLeadValidationError } from "@/lib/leads/manualLead";
import { CoordinatorAssignmentError } from "@/lib/leads/coordinatorAssignment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";
    const leads = (await listCrmLeads()).filter(
      (lead) => includeArchived || !lead.archivedAt
    );
    return NextResponse.json({ leads });
  } catch (error) {
    return handleLeadsStorageError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const lead = await createManualLead(body, {
      id: auth.user.sub,
      email: auth.user.email,
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    if (error instanceof ManualLeadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof CoordinatorAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleLeadsStorageError(error);
  }
}
