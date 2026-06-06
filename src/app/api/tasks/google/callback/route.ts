import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import {
  isPersonalGoogleTasksOAuthConfigured,
  serverGoogleTasksConfig,
} from "@/config/googleTasks";
import {
  GOOGLE_TASKS_OAUTH_STATE_COOKIE,
  resolveGoogleTasksRedirectUri,
  verifyGoogleTasksOAuthUser,
} from "@/lib/integrations/google/oauthSession";
import { saveGoogleTasksConnection } from "@/lib/tasks/googleConnectionsStorage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isPersonalGoogleTasksOAuthConfigured()) {
    return NextResponse.json(
      { error: "Google Tasks OAuth is not configured" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const oauthError = url.searchParams.get("error")?.trim();
  const expectedState = request.cookies.get(GOOGLE_TASKS_OAUTH_STATE_COOKIE)?.value;
  const userToken = request.cookies.get("google_tasks_oauth_user")?.value;
  const email = userToken ? verifyGoogleTasksOAuthUser(userToken) : null;

  if (oauthError) {
    const redirectUrl = new URL("/admin/tasks", request.nextUrl.origin);
    redirectUrl.searchParams.set("google", "error");
    redirectUrl.searchParams.set("message", oauthError);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState || !email) {
    return NextResponse.json(
      { error: "Invalid OAuth callback — missing or mismatched state" },
      { status: 400 }
    );
  }

  try {
    const redirectUri = resolveGoogleTasksRedirectUri(request.nextUrl.origin);
    const client = new OAuth2Client(
      serverGoogleTasksConfig.oauthClientId,
      serverGoogleTasksConfig.oauthClientSecret,
      redirectUri
    );
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error(
        "No refresh token returned. Revoke app access in Google Account settings and try again."
      );
    }

    await saveGoogleTasksConnection({
      email,
      refreshToken: tokens.refresh_token,
      taskListId: null,
      syncAllTasks: false,
      connectedAt: new Date().toISOString(),
    });

    const redirectUrl = new URL("/admin/tasks", request.nextUrl.origin);
    redirectUrl.searchParams.set("google", "connected");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(GOOGLE_TASKS_OAUTH_STATE_COOKIE);
    response.cookies.delete("google_tasks_oauth_user");
    return response;
  } catch (error) {
    console.error("[tasks/google/callback] failed:", error);
    const message =
      error instanceof Error ? error.message : "Google Tasks OAuth exchange failed";
    const redirectUrl = new URL("/admin/tasks", request.nextUrl.origin);
    redirectUrl.searchParams.set("google", "error");
    redirectUrl.searchParams.set("message", message);
    return NextResponse.redirect(redirectUrl);
  }
}
