import { NextRequest, NextResponse } from "next/server";
import {
  listProposalIdsForClient,
  readProposalMetadata,
} from "@/lib/proposals/storage";
import { handleProposalsStorageError, requireManagementAuth } from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const clientId = request.nextUrl.searchParams.get("client_id")?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  try {
    const proposalIds = await listProposalIdsForClient(clientId);
    const proposals = (
      await Promise.all(
        proposalIds.map((proposalId) => readProposalMetadata(clientId, proposalId))
      )
    ).filter(Boolean);
    return NextResponse.json({ proposals });
  } catch (error) {
    return handleProposalsStorageError(error);
  }
}
