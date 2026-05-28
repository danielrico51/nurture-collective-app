import { NextRequest, NextResponse } from "next/server";
import { isSlackConfigured } from "@/config/slack";
import { postSlackMessage } from "@/lib/integrations/slack/client";
import {
  requireManagementAuth,
} from "@/lib/api/routeHelpers";

export const dynamic = "force-dynamic";

/** Send a test message to each configured Slack channel (admin only). */
export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  if (!isSlackConfigured()) {
    return NextResponse.json(
      {
        error:
          "Slack is not configured. Set SLACK_ENABLED=true and webhooks or SLACK_BOT_TOKEN.",
      },
      { status: 503 }
    );
  }

  let body: { channel?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  const channel =
    body.channel === "scheduledCalls" ||
    body.channel === "operations" ||
    body.channel === "lostLeads"
      ? body.channel
      : "newLeads";

  const text = `Slack dev test from Nurture Collective — ${channel} channel (${new Date().toISOString()})`;

  try {
    const sent = await postSlackMessage({
      channel,
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Slack integration test*\nChannel: \`${channel}\`\nTriggered by admin: ${auth.user?.email ?? auth.user?.sub ?? "unknown"}`,
          },
        },
      ],
    });

    return NextResponse.json({ ok: true, sent, channel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slack test failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
