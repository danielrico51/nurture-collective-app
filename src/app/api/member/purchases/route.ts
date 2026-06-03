import { requireAuthUser } from "@/lib/api/authHelpers";
import { listMemberPurchases } from "@/lib/purchases/memberPurchases";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuthUser(request);
  if (error) return error;

  const email = user!.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "Your account has no email on file. Update your profile to see purchases." },
      { status: 400 }
    );
  }

  try {
    const purchases = await listMemberPurchases({
      email,
      userId: user!.sub,
    });

    return NextResponse.json({
      ok: true,
      email,
      purchases,
    });
  } catch (err) {
    console.error("[member/purchases] failed:", err);
    const message = err instanceof Error ? err.message : "Could not load purchases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
