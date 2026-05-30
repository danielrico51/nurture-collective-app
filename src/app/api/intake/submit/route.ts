import { NextRequest, NextResponse } from "next/server";
import { intakeSubmitConfig } from "@/config/intakeSubmit";
import {
  IntakePipelineError,
  IntakeValidationError,
  submitIntakeWorkflow,
} from "@/lib/intake/submitService";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

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
      {
        success: false,
        error: "Too many submissions. Please wait and try again.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", code: "invalid_json" },
      { status: 400 }
    );
  }

  try {
    const result = await submitIntakeWorkflow(body);
    return NextResponse.json({
      success: true,
      lead_id: result.lead_id,
      forwarded: result.forwarded,
      stored: result.stored,
    });
  } catch (error) {
    if (error instanceof IntakeValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: "validation_error" },
        { status: 400 }
      );
    }
    if (error instanceof IntakePipelineError) {
      return NextResponse.json(
        { success: false, error: error.message, code: "pipeline_error" },
        { status: 502 }
      );
    }
    console.error("[intake-submit] unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Could not submit intake.", code: "internal_error" },
      { status: 500 }
    );
  }
}
