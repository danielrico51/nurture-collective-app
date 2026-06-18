import { NextRequest, NextResponse } from "next/server";
import {
  handleClientsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { findClientByLeadId } from "@/lib/clients/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { leadId: string } };

/** Resolve a client linked to a lead (used by Lead CRM conversion UI). */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(_request);
  if (auth.error) return auth.error;

  try {
    const client = await findClientByLeadId(params.leadId);
    return NextResponse.json({ client });
  } catch (error) {
    return handleClientsStorageError(error);
  }
}
