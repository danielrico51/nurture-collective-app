import { NextRequest, NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import { reverseGeocodeZip } from "@/lib/coverage/geocode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const result = await reverseGeocodeZip(lat, lng);
    if (!result) {
      return NextResponse.json(
        { error: "Could not resolve a ZIP code for this location" },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/coverage/reverse-geocode] failed:", error);
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 });
  }
}
