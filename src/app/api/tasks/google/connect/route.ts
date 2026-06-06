import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import {
  isPersonalGoogleTasksOAuthConfigured,
  serverGoogleTasksConfig,
} from "@/config/googleTasks";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import {
  applyGoogleTasksOAuthStateCookie,
  createGoogleTasksOAuthState,
  resolveGoogleTasksRedirectUri,
  signGoogleTasksOAuthUser,
} from "@/lib/integrations/google/oauthSession";

export const dynamic = "force-dynamic";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  if (!isPersonalGoogleTasksOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Tasks personal sync is not configured. Set GOOGLE_TASKS_OAUTH_CLIENT_ID and GOOGLE_TASKS_OAUTH_CLIENT_SECRET.",
      },
      { status: 503 }
    );
  }

  const state = createGoogleTasksOAuthState();
  const userToken = signGoogleTasksOAuthUser(auth.user!.email);
  const redirectUri = resolveGoogleTasksRedirectUri(request.nextUrl.origin);
  const client = new OAuth2Client(
    serverGoogleTasksConfig.oauthClientId,
    serverGoogleTasksConfig.oauthClientSecret,
    redirectUri
  );
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [TASKS_SCOPE],
    state,
    include_granted_scopes: true,
  });

  const response = NextResponse.json({
    ok: true,
    authorizeUrl,
    redirectUri,
  });
  applyGoogleTasksOAuthStateCookie(response, state);
  response.cookies.set("google_tasks_oauth_user", userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
