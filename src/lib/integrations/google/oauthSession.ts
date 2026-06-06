import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { serverGoogleTasksConfig } from "@/config/googleTasks";

export const GOOGLE_TASKS_OAUTH_STATE_COOKIE = "google_tasks_oauth_state";

const getStateSecret = (): string =>
  process.env.GOOGLE_TASKS_OAUTH_STATE_SECRET?.trim() ||
  process.env.GOOGLE_TASKS_OAUTH_CLIENT_SECRET?.trim() ||
  "google-tasks-oauth-state";

export const createGoogleTasksOAuthState = (): string =>
  randomBytes(24).toString("hex");

export const applyGoogleTasksOAuthStateCookie = (
  response: NextResponse,
  state: string
): void => {
  response.cookies.set(GOOGLE_TASKS_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
};

export const resolveGoogleTasksRedirectUri = (origin: string): string => {
  const configured = serverGoogleTasksConfig.oauthRedirectUri?.trim();
  if (configured && !configured.includes("localhost:3333")) {
    return configured;
  }
  return `${origin.replace(/\/$/, "")}/api/tasks/google/callback`;
};

export const signGoogleTasksOAuthUser = (email: string): string => {
  const payload = `${email}:${Date.now()}`;
  const sig = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
};

export const verifyGoogleTasksOAuthUser = (token: string): string | null => {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", getStateSecret())
      .update(payload)
      .digest("hex");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    const [email, issuedAtRaw] = payload.split(":");
    const issuedAt = Number(issuedAtRaw);
    if (!email || !Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > 1000 * 60 * 15) return null;
    return email;
  } catch {
    return null;
  }
};
