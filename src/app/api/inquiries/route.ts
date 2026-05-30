import { NextRequest, NextResponse } from "next/server";
import { mapContactFormToIntakeSubmit } from "@/lib/intake/mapContactForm";
import {
  IntakePipelineError,
  IntakeValidationError,
  submitIntakeWorkflow,
} from "@/lib/intake/submitService";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { intakeSubmitConfig } from "@/config/intakeSubmit";
import type {
  InquiryPayload,
  PreferredContactMethod,
} from "@/types/inquiry";
import { isAudience } from "@/types/inquiry";
import type { Audience } from "@/content/site";

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
  providerSpecialty?: string;
  audience?: string;
  source?: string;
  userId?: string;
}

const getClientKey = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    getClientKey(request),
    intakeSubmitConfig.rateLimitMaxRequests,
    intakeSubmitConfig.rateLimitWindowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait and try again." },
      { status: 429 }
    );
  }

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
  const providerSpecialty = body.providerSpecialty?.trim() || undefined;
  const audienceRaw = body.audience?.trim() ?? null;
  const audience: Audience = isAudience(audienceRaw) ? audienceRaw : "mom";
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
    audience,
    name,
    email,
    phone,
    message,
    preferredContact: preferredContact ?? "email",
    serviceInterest: audience === "mom" ? serviceInterest : undefined,
    providerSpecialty: audience === "provider" ? providerSpecialty : undefined,
    submittedAt: new Date().toISOString(),
    ...(source === "member-intake" && userId ? { userId } : {}),
  };

  console.info("[inquiry] Received submission", {
    source: payload.source,
    audience: payload.audience,
    email: payload.email,
    preferredContact: payload.preferredContact,
    serviceInterest: payload.serviceInterest,
    providerSpecialty: payload.providerSpecialty,
  });

  try {
    const intakePayload = mapContactFormToIntakeSubmit({
      audience,
      name,
      email,
      phone,
      message,
      preferredContact: preferredContact ?? "email",
      serviceSlug: serviceInterest,
      specialtySlug: providerSpecialty,
    });
    intakePayload.source = source;

    const result = await submitIntakeWorkflow(intakePayload);
    return NextResponse.json({
      ok: true,
      forwarded: result.forwarded,
      lead_id: result.lead_id,
    });
  } catch (error) {
    if (error instanceof IntakeValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof IntakePipelineError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[inquiry] intake pipeline failed:", error);
    return NextResponse.json(
      { error: "Could not submit inquiry. Please try again later." },
      { status: 502 }
    );
  }
}
