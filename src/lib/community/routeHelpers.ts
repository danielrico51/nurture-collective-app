import { NextRequest, NextResponse } from "next/server";
import {
  CommunityServiceError,
  proxyCommunityRequest,
  readCommunityJson,
} from "@/lib/community/proxy";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export const requireMemberAuth = async (request: NextRequest) => {
  const user = await verifyRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  return { error: null, user };
};

export const handleCommunityProxyError = (error: unknown) => {
  if (error instanceof CommunityServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("Failed to fetch")
  ) {
    return NextResponse.json(
      {
        error:
          "Community service is not reachable. Start it with: cd community-service && docker compose up -d",
      },
      { status: 503 }
    );
  }

  console.error("Community proxy error:", error);
  return NextResponse.json(
    { error: "Community service request failed" },
    { status: 502 }
  );
};

export const proxyCommunityGet = async (
  request: NextRequest,
  path: string
) => {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  try {
    const response = await proxyCommunityRequest(auth.user!, path);
    const { status, data } = await readCommunityJson(response);
    return NextResponse.json(data, { status });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
};

export const proxyCommunityPost = async (
  request: NextRequest,
  path: string,
  body: unknown = {}
) => {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  try {
    const response = await proxyCommunityRequest(auth.user!, path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const { status, data } = await readCommunityJson(response);
    return NextResponse.json(data, { status });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
};
