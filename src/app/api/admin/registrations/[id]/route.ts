import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  ClassRegistrationValidationError,
  updateClassRegistration,
} from "@/lib/classRegistrations/service";
import type { UpdateClassRegistrationInput } from "@/types/classRegistration";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: UpdateClassRegistrationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const registration = await updateClassRegistration(params.id, body);
    return NextResponse.json({ registration });
  } catch (error) {
    if (error instanceof ClassRegistrationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleEventsStorageError(error);
  }
}
