import { NextRequest, NextResponse } from "next/server";
import { canSendProposalForSignature } from "@/lib/proposals/auth";
import { sendProposalForSignature } from "@/lib/proposals/service";
import { handleProposalsStorageError, requireManagementAuth } from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;
  if (!canSendProposalForSignature(auth.user!)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      client_id?: string;
      signer_email?: string;
    };
    const clientId = body.client_id?.trim();
    const signerEmail = body.signer_email?.trim();
    if (!clientId || !signerEmail) {
      return NextResponse.json(
        { error: "client_id and signer_email are required" },
        { status: 400 }
      );
    }

    const metadata = await sendProposalForSignature({
      clientId,
      proposalId: params.proposalId,
      actor: auth.user!,
      signerEmail,
    });
    return NextResponse.json({ metadata });
  } catch (error) {
    return handleProposalsStorageError(error);
  }
}
