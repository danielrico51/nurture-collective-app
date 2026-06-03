import { NextResponse } from "next/server";
import { handleJournalStorageError } from "@/lib/api/routeHelpers";

export const runJournalRoute = async (
  handler: () => Promise<NextResponse>
): Promise<NextResponse> => {
  try {
    return await handler();
  } catch (error) {
    return handleJournalStorageError(error);
  }
};
