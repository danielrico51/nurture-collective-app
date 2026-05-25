import { NextRequest, NextResponse } from "next/server";
import { serverIntegrations } from "@/config/integrations";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type {
  InquiryPayload,
  PreferredContactMethod,
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PREFERRED: PreferredContactMethod[] = ["email", "whatsapp", "call"];

interface InquiryBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  preferredContact?: string;
  serviceInterest?: string;
  source?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  let body: InquiryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const phone = body.phone?.trim() || undefined;
  const preferredContact = body.preferredContact?.trim() as
    | PreferredContactMethod
    | undefined;
  const serviceInterest = body.serviceInterest?.trim() || undefined;
  const source =
    body.source === "member-intake" ? "member-intake" : "website";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required" },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (
    preferredContact &&
    !VALID_PREFERRED.includes(preferredContact)
  ) {
    return NextResponse.json(
      { error: "Invalid preferred contact method" },
      { status: 400 }
    );
  }

  const userId = body.userId?.trim() || undefined;

  const payload: InquiryPayload = {
    source,
    name,
    email,
    phone,
    message,
    preferredContact: preferredContact ?? "email",
    serviceInterest,
    submittedAt: new Date().toISOString(),
    ...(source === "member-intake" && userId ? { userId } : {}),
  };

  console.info("[inquiry] Received submission", {
    source: payload.source,
    email: payload.email,
    preferredContact: payload.preferredContact,
    serviceInterest: payload.serviceInterest,
  });

  try {
    const result = await forwardToN8n(
      serverIntegrations.n8nInquiryWebhookUrl,
      serverIntegrations.n8nWebhookSecret,
      payload
    );

    return NextResponse.json({
      ok: true,
      forwarded: result.forwarded,
    });
  } catch (error) {
    console.error("[inquiry] n8n forward failed:", error);
    return NextResponse.json(
      { error: "Could not submit inquiry. Please try again later." },
      { status: 502 }
    );
  }
}
