import { NextRequest, NextResponse } from "next/server";
import {
  CommunityServiceError,
  proxyCommunityRequest,
  readCommunityJson,
} from "@/lib/community/proxy";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export const requireMemberAuth = async (request: NextRequest) => {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      authorizationHeader: null,
    };
  }

  const user = await verifyRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      authorizationHeader: null,
    };
  }
  return { error: null, user, authorizationHeader };
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
    const response = await proxyCommunityRequest(
      auth.authorizationHeader!,
      path
    );
    const { status, data } = await readCommunityJson(response);
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Community service rejected your session. Restart community-service after setting COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID (same as Next.js), or sign in again.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(data, { status });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
};

export const proxyCommunityDelete = async (
  request: NextRequest,
  path: string
) => {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  try {
    const response = await proxyCommunityRequest(
      auth.authorizationHeader!,
      path,
      { method: "DELETE" }
    );
    const { status, data } = await readCommunityJson(response);
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Community service rejected your session. Restart community-service after setting COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID (same as Next.js), or sign in again.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(data, { status });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
};

export const proxyCommunityPatch = async (
  request: NextRequest,
  path: string,
  body: unknown
) => {
  const auth = await requireMemberAuth(request);
  if (auth.error) return auth.error;

  try {
    const response = await proxyCommunityRequest(
      auth.authorizationHeader!,
      path,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    const { status, data } = await readCommunityJson(response);
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Community service rejected your session. Restart community-service after setting COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID (same as Next.js), or sign in again.",
        },
        { status: 401 }
      );
    }
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
    const response = await proxyCommunityRequest(
      auth.authorizationHeader!,
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const { status, data } = await readCommunityJson(response);
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Community service rejected your session. Restart community-service after setting COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID (same as Next.js), or sign in again.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(data, { status });
  } catch (error) {
    return handleCommunityProxyError(error);
  }
};
