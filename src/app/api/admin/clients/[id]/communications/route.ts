import { NextRequest, NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import {
  getClientById,
  listCommunicationsForClient,
} from "@/lib/clients/storage";
import {
  buildProposalFollowUpEmail,
  buildWelcomeEmail,
  sendClientEmail,
} from "@/lib/clients/communications";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const communications = await listCommunicationsForClient(params.id);
    return NextResponse.json({ communications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load communications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error || !auth.user) return auth.error;

  let body: {
    to?: string;
    subject?: string;
    body?: string;
    template?: "welcome" | "proposal_follow_up";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const client = await getClientById(params.id);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let subject = body.subject?.trim() ?? "";
  let text = body.body?.trim() ?? "";
  let html: string | undefined;
  let templateId: string | undefined;

  if (body.template) {
    const template =
      body.template === "welcome"
        ? buildWelcomeEmail(client)
        : buildProposalFollowUpEmail(client);
    subject = subject || template.subject;
    text = text || template.text;
    html = template.html;
    templateId = body.template;
  }

  if (!subject || !text) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  try {
    const communication = await sendClientEmail({
      client,
      to: body.to,
      subject,
      body: text,
      html,
      templateId,
      sentBy: auth.user.sub,
      sentByEmail: auth.user.email,
    });
    return NextResponse.json({ communication }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send email";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
