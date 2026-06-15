import { NextRequest, NextResponse } from "next/server";
import { canGenerateProposals } from "@/lib/proposals/auth";
import { generateProposalForClient } from "@/lib/proposals/service";
import { handleProposalsStorageError, requireManagementAuth } from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;
  if (!canGenerateProposals(auth.user!)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { client_id?: string };
    const clientId = body.client_id?.trim();
    if (!clientId) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    const result = await generateProposalForClient({
      clientId,
      actor: auth.user!,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleProposalsStorageError(error);
  }
}
