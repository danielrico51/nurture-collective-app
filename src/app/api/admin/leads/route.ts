import { NextRequest, NextResponse } from "next/server";
import {
  handleLeadsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listCrmLeads } from "@/lib/leads/storage";

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
