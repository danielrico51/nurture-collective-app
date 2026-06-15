import { NextRequest, NextResponse } from "next/server";
import { canApproveProposals, canGenerateProposals } from "@/lib/proposals/auth";
import { approveProposal, requestProposalRevision } from "@/lib/proposals/service";
import { handleProposalsStorageError, requireManagementAuth } from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      client_id?: string;
      action?: "approve" | "revise";
      feedback?: string;
    };
    const clientId = body.client_id?.trim();
    if (!clientId) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    if (body.action === "approve") {
      if (!canApproveProposals(auth.user!)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const metadata = await approveProposal({
        clientId,
        proposalId: params.proposalId,
        actor: auth.user!,
      });
      return NextResponse.json({ metadata });
    }

    if (body.action === "revise") {
      if (!canGenerateProposals(auth.user!)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const feedback = body.feedback?.trim();
      if (!feedback) {
        return NextResponse.json({ error: "feedback is required" }, { status: 400 });
      }
      const result = await requestProposalRevision({
        clientId,
        proposalId: params.proposalId,
        feedback,
        actor: auth.user!,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return handleProposalsStorageError(error);
  }
}
