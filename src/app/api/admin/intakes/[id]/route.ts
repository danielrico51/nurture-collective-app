import { NextRequest, NextResponse } from "next/server";
import {
  handleIntakeStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { updateProfileStatus } from "@/lib/intake/storage";
import { syncLeadFromIntake } from "@/lib/leads/storage";
import { INTAKE_STATUSES, type IntakeStatus } from "@/types/intake";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: { intakeStatus?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intakeStatus = body.intakeStatus as IntakeStatus | undefined;
  if (!intakeStatus || !INTAKE_STATUSES.includes(intakeStatus)) {
    return NextResponse.json(
      { error: "Valid intakeStatus is required (draft, submitted, in-review)" },
      { status: 400 }
    );
  }

  try {
    const profile = await updateProfileStatus(params.id, intakeStatus);
    await syncLeadFromIntake({
      userId: profile.userId,
      intake: profile,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }
    return handleIntakeStorageError(error);
  }
}
